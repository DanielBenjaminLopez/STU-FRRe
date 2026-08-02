"""
Motor de parsing OCR para horarios en PDF.

Pipeline: PDF → imagen → Tesseract OCR → JSON estructurado.

Las tablas del PDF tienen una grilla consistente:
- 7 columnas: Horario | Lunes | Martes | Miércoles | Jueves | Viernes | Sábado
- Filas por franjas horarias (ej: "07:45 a 08:30")
- Materias en las celdas, con posible info de aula y comisión

NOTA: Esta es una primera aproximación. Los nombres de materias y aulas
extraídos por OCR pueden no ser 100% precisos. Se recomienda revisión
manual en la vista previa antes de importar.

MEJORAS FUTURAS:
- [ ] Fuzzy matching de nombres de materias contra BD existente
- [ ] Validación de aulas contra espacios del mapa
- [ ] Aceptación directa de imágenes (PNG, JPG) como fuente
"""

import logging
import re
from dataclasses import dataclass, field

import pytesseract
from PIL import Image, ImageFilter, ImageOps
from pdf2image import convert_from_bytes

logger = logging.getLogger(__name__)

DAYS_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
DAYS_HEADER = ["LUNES", "MARTES", "MIÉRCOLES", "MIERCOLES", "JUEVES", "VIERNES", "SÁBADO", "SABADO"]

YEAR_KEYWORDS = {
    "PRIMER AÑO": "primero",
    "PRIMERO AÑO": "primero",
    "SEGUNDO AÑO": "segundo",
    "SEGUNDO AÑO": "segundo",
    "TERCER AÑO": "tercero",
    "TERCERO AÑO": "tercero",
    "CUARTO AÑO": "cuarto",
    "CUARTO AÑO": "cuarto",
    "QUINTO AÑO": "quinto",
    "QUINTO AÑO": "quinto",
}

TIME_PATTERN = re.compile(r"(\d{1,2}:\d{2})\s*a\s*(\d{1,2}:\d{2})")
AULA_PATTERN = re.compile(
    r"(?:Aula|AULA|aula)\s*[\d.]+"
    r"|(?:Lab|LAB|lab)\s*[\w\d\-]+"
    r"|Aula\s+Magna|AULA\s+MAGNA|aula\s+magna"
    r"|X\d+\.\d+",
    re.IGNORECASE,
)
COMISION_PATTERN = re.compile(r"^\s*(C\d+|Curso\s*\d+)\s*$", re.IGNORECASE)


@dataclass
class CellData:
    """Una celda detectada en la grilla."""

    row_idx: int
    col_idx: int
    text: str
    aula: str | None = None
    comision: str | None = None


@dataclass
class HorarioRow:
    """Un registro de horario extraído."""

    anio: str
    comision: str
    materia: str
    dia: str
    hora_inicio: str
    hora_fin: str
    aula: str | None = None


@dataclass
class ParseResult:
    """Resultado completo del parsing de un PDF."""

    carrera: str = "Ingeniería en Sistemas de Información"
    cuatrimestre: str = "2do"
    anio_plan: int = 2026
    horarios: list[HorarioRow] = field(default_factory=list)
    paginas_procesadas: int = 0
    errores: list[str] = field(default_factory=list)


def _preprocess_image(img: Image.Image) -> Image.Image:
    """Pre-procesa la imagen para mejorar OCR."""
    gray = ImageOps.grayscale(img)
    contrasted = ImageOps.autocontrast(gray, cutoff=2)
    threshold = contrasted.point(lambda x: 0 if x < 140 else 255, "1")
    return threshold


def _detect_columns_from_boxes(
    boxes: list[dict], page_width: int
) -> list[tuple[int, int]]:
    """
    Detecta las posiciones X de las 7 columnas (horario + 6 días).

    Estrategia: los textos de tiempo están todos en la primera columna (izquierda).
    Se detecta dónde termina la columna de tiempo y se divide el resto en 6 partes iguales.
    """
    if not boxes:
        return []

    time_boxes = [b for b in boxes if TIME_PATTERN.search(b["text"])]
    if not time_boxes:
        est_width = page_width // 7
        return [(i * est_width, (i + 1) * est_width) for i in range(7)]

    time_right_edges = [b["left"] + b["width"] for b in time_boxes]
    time_col_end = max(time_right_edges) + int(page_width * 0.02)

    day_col_start = time_col_end
    day_cols = []
    day_width = (page_width - day_col_start) // 6
    for i in range(6):
        x_start = day_col_start + i * day_width
        x_end = day_col_start + (i + 1) * day_width if i < 5 else page_width
        day_cols.append((x_start, x_end))

    return [(0, time_col_end)] + day_cols


def _detect_rows_from_boxes(
    boxes: list[dict], page_height: int
) -> list[tuple[int, int]]:
    """
    Detecta las posiciones Y de las filas a partir de los bounding boxes.
    Retorna lista de (y_start, y_end) para cada fila.
    """
    if not boxes:
        return []

    y_positions = sorted(set(b["top"] for b in boxes))

    rows = []
    current_row_start = y_positions[0] if y_positions else 0
    last_y = current_row_start

    for y in y_positions[1:]:
        if y - last_y > page_height * 0.015:
            rows.append((current_row_start, last_y + int(page_height * 0.01)))
            current_row_start = y
        last_y = y

    if y_positions:
        rows.append((current_row_start, y_positions[-1] + int(page_height * 0.02)))

    return rows


def _assign_box_to_cell(
    box: dict,
    columns: list[tuple[int, int]],
    rows: list[tuple[int, int]],
) -> tuple[int, int] | None:
    """Asigna un bounding box a una celda (row_idx, col_idx)."""
    box_center_x = box["left"] + box["width"] // 2
    box_center_y = box["top"] + box["height"] // 2

    col_idx = None
    for i, (x_start, x_end) in enumerate(columns):
        if x_start <= box_center_x <= x_end:
            col_idx = i
            break

    row_idx = None
    for i, (y_start, y_end) in enumerate(rows):
        if y_start <= box_center_y <= y_end:
            row_idx = i
            break

    if col_idx is not None and row_idx is not None:
        return (row_idx, col_idx)
    return None


def _clean_text(text: str) -> str:
    """Limpia y normaliza texto OCR."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("–", "-").replace("—", "-")
    return text


def _is_year_header(text: str) -> str | None:
    """Detecta si el texto es un encabezado de año. Retorna el nivel o None."""
    upper = text.upper().strip()
    for keyword, nivel in YEAR_KEYWORDS.items():
        if keyword in upper:
            return nivel
    return None


def _is_course_header(text: str) -> str | None:
    """Detecta si el texto es un encabezado de curso (ej: 'Curso 1')."""
    match = re.match(r"Curso\s+(\d+(?:\s*-\s*\d+)?)", text, re.IGNORECASE)
    if match:
        return f"Curso {match.group(1)}"
    if "//" in text and "Analista" in text:
        return "Curso 2-4 // Analista"
    return None


def _is_day_header(text: str) -> bool:
    """Detecta si el texto es un encabezado de día."""
    upper = text.upper().strip()
    return upper in DAYS_HEADER


def _extract_materia_and_extra(cell_text: str) -> tuple[str, str | None, str | None]:
    """
    Extrae el nombre de materia y datos extra (aula, comisión) de un texto de celda.
    Retorna (materia, aula, comision).
    """
    text = _clean_text(cell_text)
    if not text:
        return "", None, None

    aula = None
    aula_match = AULA_PATTERN.search(text)
    if aula_match:
        aula = aula_match.group().strip()
        text = text[: aula_match.start()] + text[aula_match.end() :]
        text = text.strip()

    comision = None
    comision_match = COMISION_PATTERN.search(text)
    if comision_match:
        comision = comision_match.group(1).strip()
        text = text[: comision_match.start()] + text[comision_match.end() :]
        text = text.strip()

    text = re.sub(r"^\s*//\s*$", "", text).strip()
    text = re.sub(r"\s*//\s*", " ", text).strip()

    text = re.sub(r"\b\d{1,2}:\d{2}\b", "", text).strip()
    text = re.sub(r"^[\d:.\s]+$", "", text).strip()
    text = re.sub(r"^[|/\\]+$", "", text).strip()
    text = re.sub(r"\|+$", "", text).strip()
    text = re.sub(r"\.{2,}", "", text).strip()
    text = re.sub(r"\(.*?\)", "", text).strip()
    text = re.sub(r"\bCc\d+\b", "", text).strip()
    text = re.sub(r"[\[\]{}]", "", text).strip()
    text = re.sub(r"\+\d[\d.]*", "", text).strip()
    text = re.sub(r"\bll\b", "II", text).strip()
    text = re.sub(r"\bNum\.?\s*", "", text).strip()
    text = re.sub(r"\s+", " ", text).strip()

    materia = _clean_text(text)

    if materia and re.match(r"^\d+[-]\d+$", materia):
        return "", None, None
    if materia and len(materia) <= 2:
        return "", None, None

    if not materia and not aula and not comision:
        return "", None, None

    return materia, aula, comision


def _consolidate_merged_cells(
    grid: dict[tuple[int, int], CellData],
    rows: list[tuple[int, int]],
    time_slots: list[tuple[str, str]],
) -> list[HorarioRow]:
    """
    Consolida celdas merged: misma materia en filas consecutivas del mismo día
    se convierte en un solo horario.

    Maneja texto continuado (ej: "Sistemas y" + "Proc. de Neg." → "Sistemas y Proc. de Neg.").
    """
    if not time_slots:
        return []

    results = []
    days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]

    def _is_continuation(text: str) -> bool:
        """Detecta si el texto parece continuación de una línea anterior."""
        if not text:
            return False
        text = text.strip()
        if len(text) < 4:
            return True
        lower = text.lower()
        if lower.startswith(("de ", "del ", "la ", "el ", "los ", "las ", "y ", "o ", "a ")):
            return True
        if not text[0].isupper():
            return True
        if re.match(r"^(Proc|Num|An|Sist|Fundam|Asp|A\.A)\b", text):
            return True
        return False

    for col_idx, day in enumerate(days):
        day_col = col_idx + 1
        if day_col > 6:
            break

        i = 0
        while i < len(rows):
            cell = grid.get((i, day_col))
            if not cell or not cell.text:
                i += 1
                continue

            materia, aula, comision = _extract_materia_and_extra(cell.text)
            if not materia:
                i += 1
                continue

            start_row = i
            end_row = i
            full_materia = materia

            j = i + 1
            while j < len(rows):
                next_cell = grid.get((j, day_col))
                if next_cell and next_cell.text:
                    next_materia, _, _ = _extract_materia_and_extra(next_cell.text)
                    if next_materia == materia:
                        end_row = j
                        j += 1
                        continue
                    if _is_continuation(next_materia):
                        full_materia = full_materia + " " + next_materia
                        end_row = j
                        j += 1
                        continue
                break

            if start_row < len(time_slots) and end_row < len(time_slots):
                hora_inicio = time_slots[start_row][0]
                hora_fin = time_slots[end_row][1]

                aula_final = aula
                comision_final = comision
                for r in range(start_row, end_row + 1):
                    c = grid.get((r, day_col))
                    if c:
                        _, a, co = _extract_materia_and_extra(c.text)
                        if a and not aula_final:
                            aula_final = a
                        if co and not comision_final:
                            comision_final = co

                results.append(
                    HorarioRow(
                        anio="",
                        comision=comision_final or "",
                        materia=full_materia,
                        dia=day,
                        hora_inicio=hora_inicio,
                        hora_fin=hora_fin,
                        aula=aula_final,
                    )
                )

            i = end_row + 1

    return results


def _group_boxes_into_lines(
    boxes: list[dict], line_threshold: int = 20
) -> list[list[dict]]:
    """
    Agrupa bounding boxes en líneas por su posición Y.
    Cajas con Y similar (dentro de line_threshold) se consideran de la misma línea.
    Retorna lista de líneas, cada una es una lista de boxes ordenados por X.
    """
    if not boxes:
        return []

    sorted_boxes = sorted(boxes, key=lambda b: (b["top"], b["left"]))

    lines: list[list[dict]] = []
    current_line: list[dict] = [sorted_boxes[0]]
    current_y = sorted_boxes[0]["top"]

    for box in sorted_boxes[1:]:
        if abs(box["top"] - current_y) <= line_threshold:
            current_line.append(box)
        else:
            current_line.sort(key=lambda b: b["left"])
            lines.append(current_line)
            current_line = [box]
            current_y = box["top"]

    current_line.sort(key=lambda b: b["left"])
    lines.append(current_line)

    return lines


def _join_line_text(line_boxes: list[dict]) -> str:
    """Une el texto de una línea respetando el orden X."""
    return " ".join(b["text"] for b in line_boxes)


def _parse_page(
    img: Image.Image, page_idx: int, current_year: str
) -> tuple[list[HorarioRow], str, list[str]]:
    """
    Parsea una página individual del PDF.

    Estrategia:
    1. OCR → bounding boxes
    2. Agrupar boxes en líneas por posición Y
    3. Buscar patrones de tiempo en cada línea unida
    4. Detectar columnas y armar grilla
    5. Consolidar celdas merged

    Retorna (horarios, year_actualizado, errores).
    """
    errors = []
    preprocessed = _preprocess_image(img)
    data = pytesseract.image_to_data(
        preprocessed,
        lang="spa",
        config="--psm 6",
        output_type=pytesseract.Output.DICT,
    )

    boxes = []
    for i in range(len(data["text"])):
        text = data["text"][i].strip()
        conf = int(data["conf"][i]) if data["conf"][i] != "-1" else 0
        if text and conf > 10:
            boxes.append(
                {
                    "text": text,
                    "left": data["left"][i],
                    "top": data["top"][i],
                    "width": data["width"][i],
                    "height": data["height"][i],
                    "conf": conf,
                }
            )

    if not boxes:
        return [], current_year, [f"Página {page_idx + 1}: no se detectó texto"]

    page_width = img.width
    page_height = img.height

    year_level = current_year
    course_name = None
    text_blocks = []

    for box in boxes:
        text = box["text"]
        detected_year = _is_year_header(text)
        if detected_year:
            year_level = detected_year
            continue

        detected_course = _is_course_header(text)
        if detected_course:
            course_name = detected_course
            continue

        if _is_day_header(text):
            continue

        text_blocks.append(box)

    lines = _group_boxes_into_lines(text_blocks, line_threshold=int(page_height * 0.012))

    for line in lines:
        joined = _join_line_text(line)
        detected_year = _is_year_header(joined)
        if detected_year:
            year_level = detected_year
        if not course_name:
            detected_course = _is_course_header(joined)
            if detected_course:
                course_name = detected_course

    time_slot_intervals: list[tuple[str, str]] = []
    time_slot_y_centers: list[int] = []
    other_boxes: list[dict] = []

    for line in lines:
        joined = _join_line_text(line)
        match = TIME_PATTERN.search(joined)
        if match:
            time_slot_intervals.append((match.group(1), match.group(2)))
            avg_y = sum(b["top"] for b in line) // len(line)
            time_slot_y_centers.append(avg_y)

            time_right_edges = [
                b["left"] + b["width"]
                for b in line
                if TIME_PATTERN.search(b["text"])
            ]
            time_col_end = max(time_right_edges) if time_right_edges else 0

            for b in line:
                if b["left"] >= time_col_end or (
                    not TIME_PATTERN.search(b["text"])
                    and b["left"] + b["width"] > time_col_end
                ):
                    other_boxes.append(b)
        else:
            for b in line:
                other_boxes.append(b)

    if not time_slot_intervals:
        return [], year_level, [f"Página {page_idx + 1}: no se detectaron franjas horarias"]

    rows = []
    for y_center in time_slot_y_centers:
        half = int(page_height * 0.012)
        rows.append((y_center - half, y_center + half))

    columns = _detect_columns_from_boxes(other_boxes, page_width)
    if len(columns) < 2:
        est_width = page_width // 7
        columns = [(i * est_width, (i + 1) * est_width) for i in range(7)]

    grid: dict[tuple[int, int], CellData] = {}

    for box in other_boxes:
        assignment = _assign_box_to_cell(box, columns, rows)
        if assignment:
            row_idx, col_idx = assignment
            key = (row_idx, col_idx)
            if key in grid:
                grid[key].text += " " + box["text"]
            else:
                grid[key] = CellData(row_idx=row_idx, col_idx=col_idx, text=box["text"])

    horarios = _consolidate_merged_cells(grid, rows, time_slot_intervals)

    for h in horarios:
        h.anio = year_level
        h.comision = course_name or h.comision

    return horarios, year_level, errors


def parse_pdf(pdf_bytes: bytes) -> ParseResult:
    """
    Punto de entrada principal. Parsea un PDF completo y retorna los horarios extraídos.

    Args:
        pdf_bytes: Contenido del archivo PDF en bytes.

    Returns:
        ParseResult con todos los horarios extraídos.
    """
    result = ParseResult()

    try:
        images = convert_from_bytes(pdf_bytes, dpi=200, fmt="png")
    except Exception as e:
        result.errores.append(f"Error al convertir PDF a imágenes: {e}")
        return result

    result.paginas_procesadas = len(images)
    current_year = "primero"

    for idx, img in enumerate(images):
        try:
            page_horarios, current_year, page_errors = _parse_page(img, idx, current_year)
            result.horarios.extend(page_horarios)
            result.errores.extend(page_errors)
        except Exception as e:
            result.errores.append(f"Error en página {idx + 1}: {e}")

    for h in result.horarios:
        h.comision = h.comision or ""

    logger.info(
        "PDF parseado: %d horarios en %d páginas, %d errores",
        len(result.horarios),
        result.paginas_procesadas,
        len(result.errores),
    )

    return result
