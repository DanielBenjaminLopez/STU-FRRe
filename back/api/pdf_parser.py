"""
Motor de parsing OCR para horarios en PDF.

Pipeline: PDF -> imagen -> Tesseract OCR -> JSON estructurado.

Las tablas del PDF tienen una grilla consistente:
- 7 columnas: Horario | Lunes | Martes | Miercoles | Jueves | Viernes | Sabado
- Filas por franjas horarias (ej: "07:45 a 08:30")
- Materias en las celdas, con posible info de aula y comision
- Celdas merged que pueden cubrir varias filas de tiempo
- El separador "//" indica dos materias con el mismo horario

NOTA: Los nombres de materias y aulas extraidos por OCR pueden no ser
100% precisos. Se recomienda revision manual en la vista previa antes
de importar.
"""

import logging
import re
from dataclasses import dataclass, field

import pytesseract
from PIL import Image, ImageOps
from pdf2image import convert_from_bytes

logger = logging.getLogger(__name__)

DAYS_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
DAYS_HEADER = [
    "LUNES", "MARTES", "MIÉRCOLES", "MIERCOLES",
    "JUEVES", "VIERNES", "SÁBADO", "SABADO",
]

YEAR_KEYWORDS = {
    "PRIMER AÑO": "primero",
    "PRIMERO AÑO": "primero",
    "SEGUNDO AÑO": "segundo",
    "TERCER AÑO": "tercero",
    "TERCERO AÑO": "tercero",
    "CUARTO AÑO": "cuarto",
    "QUINTO AÑO": "quinto",
}

YEAR_SINGLE_WORDS = {
    "PRIMER": "primero",
    "PRIMERO": "primero",
    "SEGUNDO": "segundo",
    "TERCER": "tercero",
    "TERCERO": "tercero",
    "CUARTO": "cuarto",
    "QUINTO": "quinto",
}

TIME_PATTERN = re.compile(r"(\d{1,2}:\d{2})\s*a\s*(\d{1,2}:\d{2})")
EMBEDDED_TIME_PATTERN = re.compile(r"\(\s*\d{1,2}:\d{2}\s*a\s*\d{1,2}:\d{2}\s*\)")
AULA_PATTERN = re.compile(
    r"(?:Aula|AULA|aula)\s*[\d.]+"
    r"|(?:Lab|LAB|lab)\s*[\w\d\-]+"
    r"|Aula\s+Magna|AULA\s+MAGNA|aula\s+magna"
    r"|X\d+\.\d+",
    re.IGNORECASE,
)
COMISION_PATTERN = re.compile(r"^\s*(C\d+|Curso\s*\d+)\s*$", re.IGNORECASE)


@dataclass
class TableRegion:
    """Region de una tabla en la pagina."""

    x_start: int
    x_end: int
    y_start: int = 0
    y_end: int = 0
    course_name: str = ""


@dataclass
class CellData:
    """Una celda detectada en la grilla."""

    row_idx: int
    col_idx: int
    text: str
    aula: str | None = None
    comision: str | None = None
    row_spans: list[int] = field(default_factory=list)
    box_top: int = 0
    box_height: int = 0


@dataclass
class HorarioRow:
    """Un registro de horario extraido."""

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

    carrera: str = "Ingenieria en Sistemas de Informacion"
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


def _clean_text(text: str) -> str:
    """Limpia y normaliza texto OCR."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    return text


def _is_year_header(text: str) -> str | None:
    """Detecta si el texto es un encabezado de anio."""
    upper = text.upper().strip()
    for keyword, nivel in YEAR_KEYWORDS.items():
        if keyword in upper:
            return nivel
    word = upper.strip()
    if word in YEAR_SINGLE_WORDS:
        return YEAR_SINGLE_WORDS[word]
    return None


def _is_course_header(text: str) -> str | None:
    """Detecta si el texto es un encabezado de curso."""
    match = re.match(r"Curso\s+(\d+(?:\s*-\s*\d+)?)", text, re.IGNORECASE)
    if match:
        return f"Curso {match.group(1)}"
    if "//" in text and "Analista" in text:
        return "Curso 2-4 // Analista"
    return None


def _is_day_header(text: str) -> bool:
    """Detecta si el texto es un encabezado de dia."""
    return text.upper().strip() in DAYS_HEADER


def _strip_embedded_time_annotations(text: str) -> str:
    """Elimina anotaciones de tiempo embebidas como (18:55 a 21:10)."""
    return EMBEDDED_TIME_PATTERN.sub("", text).strip()


def _extract_materia_and_extra(cell_text: str) -> tuple[str, str | None, str | None]:
    """
    Extrae el nombre de materia y datos extra (aula, comision) de un texto de celda.
    Retorna (materia, aula, comision).
    """
    text = _clean_text(cell_text)
    if not text:
        return "", None, None

    text = _strip_embedded_time_annotations(text)

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
    text = re.sub(r"[|/\\]+", "", text).strip()
    text = re.sub(r">{2,}", "", text).strip()
    text = re.sub(r"\.{2,}", "", text).strip()
    text = re.sub(r"\(.*?\)", "", text).strip()
    text = re.sub(r"\bCc\d+\b", "", text).strip()
    text = re.sub(r"[\[\]{}]", "", text).strip()
    text = re.sub(r"\+\d[\d.]*", "", text).strip()
    text = re.sub(r"\bll\b", "II", text).strip()
    text = re.sub(r"\bNum\.?\s*", "", text).strip()
    text = re.sub(r"\s*-\s*Plan\s+\d{4}", "", text).strip()
    text = re.sub(r"\s+", " ", text).strip()

    materia = _clean_text(text)

    if materia and re.match(r"^\d+[-]\d+$", materia):
        return "", None, None
    if materia and len(materia) <= 2:
        return "", None, None

    if not materia and not aula and not comision:
        return "", None, None

    return materia, aula, comision


def _group_boxes_into_lines(
    boxes: list[dict], line_threshold: int = 20
) -> list[list[dict]]:
    """Agrupa bounding boxes en lineas por su posicion Y."""
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
    """Une el texto de una linea respetando el orden X."""
    return " ".join(b["text"] for b in line_boxes)


def _detect_table_regions(
    boxes: list[dict], page_width: int, page_height: int
) -> list[TableRegion]:
    """
    Detecta si hay 1 o 2 tablas en la pagina.
    Busca headers de Curso o detecta dos grupos de time slots por brecha Y.
    """
    curso_headers = [b for b in boxes if _is_course_header(b["text"])]

    if len(curso_headers) >= 2:
        curso_headers.sort(key=lambda b: b["left"])
        split_x = (curso_headers[0]["left"] + curso_headers[1]["left"]) // 2
        return [
            TableRegion(x_start=0, x_end=split_x, course_name="Curso 1"),
            TableRegion(x_start=split_x, x_end=page_width, course_name="Curso 2"),
        ]

    line_threshold = int(page_height * 0.012)
    lines = _group_boxes_into_lines(boxes, line_threshold=line_threshold)

    time_line_ys: list[int] = []
    for line in lines:
        joined = _join_line_text(line)
        cleaned = _strip_embedded_time_annotations(joined)
        if TIME_PATTERN.search(cleaned):
            avg_y = sum(b["top"] for b in line) // len(line)
            time_line_ys.append(avg_y)

    time_line_ys.sort()

    if len(time_line_ys) >= 8:
        max_gap = 0
        gap_idx = 0
        for i in range(1, len(time_line_ys)):
            gap = time_line_ys[i] - time_line_ys[i - 1]
            if gap > max_gap:
                max_gap = gap
                gap_idx = i

        avg_gap = (time_line_ys[-1] - time_line_ys[0]) / max(len(time_line_ys) - 1, 1)

        if max_gap > avg_gap * 1.5 and gap_idx > 2:
            split_y = (time_line_ys[gap_idx - 1] + time_line_ys[gap_idx]) // 2
            return [
                TableRegion(
                    x_start=0, x_end=page_width, y_start=0, y_end=split_y,
                    course_name="Curso 1",
                ),
                TableRegion(
                    x_start=0, x_end=page_width, y_start=split_y, y_end=page_height,
                    course_name="Curso 2",
                ),
            ]

    return [TableRegion(x_start=0, x_end=page_width, y_start=0, y_end=page_height)]


def _detect_columns_for_region(
    boxes: list[dict], region: TableRegion, page_width: int
) -> list[tuple[int, int]]:
    """Detecta las 7 columnas dentro de una region de tabla."""
    region_boxes = [
        b for b in boxes if b["left"] >= region.x_start and b["left"] < region.x_end
    ]

    if not region_boxes:
        est_width = (region.x_end - region.x_start) // 7
        return [
            (region.x_start + i * est_width, region.x_start + (i + 1) * est_width)
            for i in range(7)
        ]

    time_boxes = [
        b for b in region_boxes if TIME_PATTERN.search(b["text"])
    ]

    if time_boxes:
        time_right_edges = [b["left"] + b["width"] for b in time_boxes]
        time_col_end = max(time_right_edges) + int(page_width * 0.01)
    else:
        time_col_end = region.x_start + (region.x_end - region.x_start) // 7

    day_col_start = time_col_end
    region_width = region.x_end - day_col_start
    day_width = region_width // 6

    columns = [(region.x_start, time_col_end)]
    for i in range(6):
        x_start = day_col_start + i * day_width
        x_end = day_col_start + (i + 1) * day_width if i < 5 else region.x_end
        columns.append((x_start, x_end))

    return columns


def _detect_rows_from_time_slots(
    time_slot_y_centers: list[int], page_height: int
) -> list[tuple[int, int]]:
    """
    Detecta filas a partir de los centros Y de los slots de tiempo.
    Usa bandas mas anchas para no perder cajas.
    """
    if not time_slot_y_centers:
        return []

    half = int(page_height * 0.025)
    rows = []
    for y_center in time_slot_y_centers:
        rows.append((y_center - half, y_center + half))

    return rows


def _compute_box_row_spans(
    box: dict, rows: list[tuple[int, int]], page_height: int
) -> list[int]:
    """
    Determina que filas cubre un bounding box usando su extension vertical.
    Retorna lista de indices de fila que el box toca significativamente.
    """
    box_y_start = box["top"]
    box_y_end = box["top"] + box["height"]

    spans = []
    for i, (row_start, row_end) in enumerate(rows):
        overlap_start = max(box_y_start, row_start)
        overlap_end = min(box_y_end, row_end)
        overlap = overlap_end - overlap_start

        if overlap > 0:
            row_height = row_end - row_start
            if overlap >= row_height * 0.25:
                spans.append(i)

    if not spans and rows:
        min_dist = float("inf")
        closest = 0
        box_center = (box_y_start + box_y_end) // 2
        for i, (row_start, row_end) in enumerate(rows):
            row_center = (row_start + row_end) // 2
            dist = abs(box_center - row_center)
            if dist < min_dist:
                min_dist = dist
                closest = i
        spans = [closest]

    return spans


def _assign_box_to_column(
    box: dict, columns: list[tuple[int, int]]
) -> int | None:
    """Asigna un bounding box a una columna por su centro X."""
    box_center_x = box["left"] + box["width"] // 2

    for i, (x_start, x_end) in enumerate(columns):
        if x_start <= box_center_x <= x_end:
            return i

    return None


def _is_continuation_improved(text: str, prev_text: str = "") -> bool:
    """
    Detecta si el texto es continuacion de un nombre de materia anterior.
    Mas permisivo que la version anterior.
    """
    if not text:
        return False

    text = text.strip()
    lower = text.lower()

    if len(text) <= 3:
        return True

    if text[0].islower():
        return True

    CONNECTORS = (
        "de ", "del ", "la ", "el ", "los ", "las ", "y ", "o ", "a ",
        "en ", "al ", "un ", "una ", "por ", "para ", "con ", "sin ",
    )
    if lower.startswith(CONNECTORS):
        return True

    if prev_text:
        prev_lower = prev_text.strip().lower()
        if prev_lower.endswith(
            (" y", " de", " del", " la", " el", " a", " en", " las", " los")
        ):
            return True

    if text.isupper() and len(text) >= 3:
        return False

    if TIME_PATTERN.search(text):
        return False

    if re.match(r"^\d+[-.]?\d*$", text):
        return False

    if prev_text and not re.match(r"^[A-ZÁÉÍÓÚ]{3,}", text):
        return True

    return False


def _consolidate_merged_cells(
    grid: dict[tuple[int, int], CellData],
    rows: list[tuple[int, int]],
    time_slots: list[tuple[str, str]],
) -> list[HorarioRow]:
    """
    Consolida celdas merged usando row_spans pre-computados.
    Si una materia cubre filas 0-2, hora_inicio=time_slots[0][0], hora_fin=time_slots[2][1].
    """
    if not time_slots:
        return []

    results = []
    days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]

    for col_idx, day in enumerate(days):
        day_col = col_idx + 1
        if day_col > 6:
            break

        day_entries = []
        for row_idx in range(len(rows)):
            cell = grid.get((row_idx, day_col))
            if cell and cell.text:
                spans = cell.row_spans if cell.row_spans else [row_idx]
                day_entries.append(
                    {
                        "row_idx": row_idx,
                        "cell": cell,
                        "spans": spans,
                    }
                )

        if not day_entries:
            continue

        used_rows: set[int] = set()
        merged_groups: list[dict] = []

        for entry in day_entries:
            row_idx = entry["row_idx"]
            if row_idx in used_rows:
                continue

            cell = entry["cell"]
            materia, aula, comision = _extract_materia_and_extra(cell.text)
            if not materia:
                used_rows.add(row_idx)
                continue

            group = {
                "materia": materia,
                "full_materia": materia,
                "aula": aula,
                "comision": comision,
                "spans": list(entry["spans"]),
                "cells": [cell],
            }
            used_rows.add(row_idx)

            for other in day_entries:
                other_row = other["row_idx"]
                if other_row in used_rows:
                    continue

                other_cell = other["cell"]
                other_materia, other_aula, other_comision = _extract_materia_and_extra(
                    other_cell.text
                )

                if not other_materia:
                    if any(s in group["spans"] for s in other["spans"]):
                        used_rows.add(other_row)
                        if other_aula and not group["aula"]:
                            group["aula"] = other_aula
                        if other_comision and not group["comision"]:
                            group["comision"] = other_comision
                    continue

                spans_overlap = set(group["spans"]) & set(other["spans"])

                if other_materia == materia:
                    group["spans"] = sorted(set(group["spans"]) | set(other["spans"]))
                    group["cells"].append(other_cell)
                    used_rows.add(other_row)
                    if other_aula and not group["aula"]:
                        group["aula"] = other_aula
                    if other_comision and not group["comision"]:
                        group["comision"] = other_comision
                    continue

                spans_adjacent = (
                    min(other["spans"]) <= max(group["spans"]) + 1
                )

                if spans_adjacent and _is_continuation_improved(
                    other_materia, group["full_materia"]
                ):
                    group["full_materia"] = (
                        group["full_materia"] + " " + other_materia
                    )
                    group["spans"] = sorted(set(group["spans"]) | set(other["spans"]))
                    group["cells"].append(other_cell)
                    used_rows.add(other_row)
                    if other_aula and not group["aula"]:
                        group["aula"] = other_aula
                    if other_comision and not group["comision"]:
                        group["comision"] = other_comision
                    continue

                for s in group["spans"]:
                    if s in other["spans"]:
                        used_rows.add(other_row)
                        if other_aula and not group["aula"]:
                            group["aula"] = other_aula
                        if other_comision and not group["comision"]:
                            group["comision"] = other_comision
                        break

            merged_groups.append(group)

        for group in merged_groups:
            spans = group["spans"]
            first_row = min(spans)
            last_row = max(spans)

            if first_row < len(time_slots) and last_row < len(time_slots):
                hora_inicio = time_slots[first_row][0]
                hora_fin = time_slots[last_row][1]
            elif first_row < len(time_slots):
                hora_inicio = time_slots[first_row][0]
                hora_fin = time_slots[first_row][1]
            else:
                continue

            results.append(
                HorarioRow(
                    anio="",
                    comision=group["comision"] or "",
                    materia=group["full_materia"],
                    dia=day,
                    hora_inicio=hora_inicio,
                    hora_fin=hora_fin,
                    aula=group["aula"],
                )
            )

    return results


def _parse_page(
    img: Image.Image, page_idx: int, current_year: str
) -> tuple[list[HorarioRow], str, list[str]]:
    """
    Parsea una pagina individual del PDF.

    Pipeline:
    1. OCR -> bounding boxes
    2. Detectar year y headers
    3. Detectar regiones de tabla (1 o 2 por pagina)
    4. Para cada region:
       a. Detectar slots de tiempo
       b. Detectar columnas
       c. Asignar boxes a celdas usando extension vertical
       d. Consolidar celdas merged
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
        return [], current_year, [f"Pagina {page_idx + 1}: no se detecto texto"]

    page_width = img.width
    page_height = img.height

    page_title_words = {
        "ingeniería", "ingenieria", "sistemas", "información", "informacion",
        "cuatrimestre", "plan", "2024", "2025", "2026", "2027",
    }

    year_level_words = {"PRIMER", "PRIMERO", "SEGUNDO", "TERCER", "TERCERO", "CUARTO", "QUINTO", "AÑO"}

    discard_words = {"2do.", "2do", "do.", "do"}

    year_level = current_year
    text_blocks = []

    header_y_max = int(page_height * 0.12)

    for box in boxes:
        text = box["text"]
        detected_year = _is_year_header(text)
        if detected_year:
            year_level = detected_year
            continue

        if _is_day_header(text):
            continue

        if _is_course_header(text):
            continue

        if text.upper().strip() in year_level_words:
            continue

        if text.strip() in discard_words:
            continue

        if box["top"] < header_y_max:
            if any(w in text.lower() for w in page_title_words):
                continue
            if len(text) <= 3:
                continue

        text_blocks.append(box)

    line_threshold = int(page_height * 0.012)
    lines = _group_boxes_into_lines(text_blocks, line_threshold=line_threshold)

    for line in lines:
        joined = _join_line_text(line)
        detected_year = _is_year_header(joined)
        if detected_year:
            year_level = detected_year

    table_regions = _detect_table_regions(text_blocks, page_width, page_height)

    all_horarios: list[HorarioRow] = []

    for region in table_regions:
        region_boxes = [
            b
            for b in text_blocks
            if b["left"] >= region.x_start
            and b["left"] < region.x_end
            and b["top"] >= region.y_start
            and b["top"] < region.y_end
        ]

        region_lines = _group_boxes_into_lines(
            region_boxes, line_threshold=line_threshold
        )

        time_slot_intervals: list[tuple[str, str]] = []
        time_slot_y_centers: list[int] = []
        region_content_boxes: list[dict] = []

        for line in region_lines:
            joined = _join_line_text(line)
            cleaned = _strip_embedded_time_annotations(joined)
            match = TIME_PATTERN.search(cleaned)
            if match:
                t_start = match.group(1)
                t_end = match.group(2)
                if (t_start, t_end) not in time_slot_intervals:
                    time_slot_intervals.append((t_start, t_end))
                    avg_y = sum(b["top"] for b in line) // len(line)
                    time_slot_y_centers.append(avg_y)

                time_box_texts = set()
                for b in line:
                    b_cleaned = _strip_embedded_time_annotations(b["text"])
                    if TIME_PATTERN.search(b_cleaned):
                        time_box_texts.add(b["text"])
                    elif re.match(r"^\d{1,2}:\d{2}$", b["text"].strip()):
                        time_box_texts.add(b["text"])
                    elif b["text"].strip().lower() == "a":
                        time_box_texts.add(b["text"])

                for b in line:
                    if b["text"] not in time_box_texts:
                        region_content_boxes.append(b)
            else:
                for b in line:
                    region_content_boxes.append(b)

        if not time_slot_intervals:
            continue

        rows = _detect_rows_from_time_slots(time_slot_y_centers, page_height)

        columns = _detect_columns_for_region(text_blocks, region, page_width)
        if len(columns) < 2:
            continue

        grid: dict[tuple[int, int], CellData] = {}

        for box in region_content_boxes:
            col_idx = _assign_box_to_column(box, columns)
            if col_idx is None or col_idx == 0:
                continue

            box_spans = _compute_box_row_spans(box, rows, page_height)

            primary_row = box_spans[len(box_spans) // 2] if box_spans else 0

            key = (primary_row, col_idx)
            if key in grid:
                existing = grid[key]
                existing.text += " " + box["text"]
                existing.row_spans = sorted(
                    set(existing.row_spans) | set(box_spans)
                )
            else:
                grid[key] = CellData(
                    row_idx=primary_row,
                    col_idx=col_idx,
                    text=box["text"],
                    row_spans=box_spans,
                    box_top=box["top"],
                    box_height=box["height"],
                )

        horarios = _consolidate_merged_cells(grid, rows, time_slot_intervals)

        for h in horarios:
            h.anio = year_level
            if region.course_name:
                h.comision = region.course_name
            elif not h.comision:
                h.comision = ""

        all_horarios.extend(horarios)

    return all_horarios, year_level, errors


def parse_pdf(pdf_bytes: bytes) -> ParseResult:
    """
    Punto de entrada principal. Parsea un PDF completo y retorna los horarios extraidos.

    Args:
        pdf_bytes: Contenido del archivo PDF en bytes.

    Returns:
        ParseResult con todos los horarios extraidos.
    """
    result = ParseResult()

    try:
        images = convert_from_bytes(pdf_bytes, dpi=200, fmt="png")
    except Exception as e:
        result.errores.append(f"Error al convertir PDF a imagenes: {e}")
        return result

    result.paginas_procesadas = len(images)
    current_year = "primero"

    for idx, img in enumerate(images):
        try:
            page_horarios, current_year, page_errors = _parse_page(
                img, idx, current_year
            )
            result.horarios.extend(page_horarios)
            result.errores.extend(page_errors)
        except Exception as e:
            result.errores.append(f"Error en pagina {idx + 1}: {e}")

    for h in result.horarios:
        h.comision = h.comision or ""

    logger.info(
        "PDF parseado: %d horarios en %d paginas, %d errores",
        len(result.horarios),
        result.paginas_procesadas,
        len(result.errores),
    )

    return result
