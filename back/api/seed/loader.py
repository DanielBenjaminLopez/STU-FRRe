import csv
from pathlib import Path

CSV_DIR = Path(__file__).resolve().parent

TIPO_CARRERA_MAP = {
    "grado": "grado",
    "tecnicatura": "tecnica",
    "tecnica": "tecnica",
    "posgrado": "posgrado",
    "diplomatura": "diplomatura",
}

NIVEL_MAP = {
    "1": "primero",
    "1ro": "primero",
    "primero": "primero",
    "2": "segundo",
    "2do": "segundo",
    "segundo": "segundo",
    "3": "tercero",
    "3ro": "tercero",
    "tercero": "tercero",
    "4": "cuarto",
    "4to": "cuarto",
    "cuarto": "cuarto",
    "5": "quinto",
    "5to": "quinto",
    "quinto": "quinto",
}

DIA_SEMANA_MAP = {
    "lun": "lunes",
    "lunes": "lunes",
    "mar": "martes",
    "martes": "martes",
    "mie": "miercoles",
    "miercoles": "miercoles",
    "jue": "jueves",
    "jueves": "jueves",
    "vie": "viernes",
    "viernes": "viernes",
    "sab": "sabado",
    "sabado": "sabado",
    "dom": "domingo",
    "domingo": "domingo",
}


def sin_tildes(texto: str) -> str:
    return (
        texto.strip()
        .lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
    )


def normalizar_hora(hora_str: str) -> str:
    partes = hora_str.strip().split(":")
    if len(partes) >= 2:
        return f"{int(partes[0]):02d}:{int(partes[1]):02d}"
    return hora_str.strip()


def leer_csv(filepath: Path):
    with open(filepath, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield {
                k.strip(): v.strip()
                for k, v in row.items()
                if k is not None and v is not None
            }


def cargar_seed_academico(Carrera, Materia, HorarioCursado, MesaExamen):
    """
    Elimina los datos académicos existentes y carga carreras, materias y horarios
    desde api/seed/carreras.csv, api/seed/materias.csv y api/seed/horarios.csv.
    """
    carreras_csv = CSV_DIR / "carreras.csv"
    materias_csv = CSV_DIR / "materias.csv"
    horarios_csv = CSV_DIR / "horarios.csv"

    if not (carreras_csv.exists() and materias_csv.exists() and horarios_csv.exists()):
        return None

    horarios_borrados = HorarioCursado.objects.all().delete()[0]
    mesas_borradas = MesaExamen.objects.all().delete()[0]
    materias_borradas = Materia.objects.all().delete()[0]
    carreras_borradas = Carrera.objects.all().delete()[0]

    carreras_por_codigo = {}
    carreras_por_nombre = {}

    for row in leer_csv(carreras_csv):
        nombre = row.get("nombre", "")
        codigo = row.get("codigo", "")
        tipo_raw = sin_tildes(row.get("tipo", "grado"))
        tipo = TIPO_CARRERA_MAP.get(tipo_raw, "grado")
        if not nombre:
            continue

        carrera = Carrera.objects.create(
            nombre=nombre,
            codigo=codigo or None,
            tipo=tipo,
        )
        if codigo:
            carreras_por_codigo[codigo.upper()] = carrera
        carreras_por_nombre[sin_tildes(nombre)] = carrera

    def resolver_carrera(valor: str):
        if not valor:
            return None
        limpio = valor.strip()
        por_cod = carreras_por_codigo.get(limpio.upper())
        if por_cod:
            return por_cod
        return carreras_por_nombre.get(sin_tildes(limpio))

    materias_map = {}
    for row in leer_csv(materias_csv):
        carrera_str = row.get("carrera", "")
        nombre = row.get("nombre", "")
        nivel_raw = sin_tildes(row.get("nivel", "primero"))
        nivel = NIVEL_MAP.get(nivel_raw, "primero")

        carrera = resolver_carrera(carrera_str)
        if not carrera or not nombre:
            continue

        materia, _ = Materia.objects.get_or_create(
            carrera=carrera,
            nombre=nombre,
            nivel=nivel,
        )
        materias_map[(carrera.id, sin_tildes(nombre))] = materia

    for row in leer_csv(horarios_csv):
        carrera_str = row.get("carrera", "")
        materia_str = row.get("materia", "")
        comision = row.get("comision_nombre") or row.get("comision") or ""
        espacio = row.get("espacio", "")
        dia_raw = sin_tildes(row.get("dia_semana", ""))
        dia_semana = DIA_SEMANA_MAP.get(dia_raw, dia_raw)
        hora_inicio = normalizar_hora(row.get("hora_inicio", ""))
        hora_fin = normalizar_hora(row.get("hora_fin", ""))

        carrera = resolver_carrera(carrera_str)
        if not carrera or not materia_str or not dia_semana or not hora_inicio or not hora_fin:
            continue

        materia = materias_map.get((carrera.id, sin_tildes(materia_str)))
        if not materia:
            continue

        HorarioCursado.objects.get_or_create(
            materia=materia,
            comision=comision,
            espacio=espacio,
            dia_semana=dia_semana,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
        )

    return {
        "eliminados": {
            "carreras": carreras_borradas,
            "materias": materias_borradas,
            "horarios": horarios_borrados,
            "mesas": mesas_borradas,
        },
        "creados": {
            "carreras": Carrera.objects.count(),
            "materias": Materia.objects.count(),
            "horarios": HorarioCursado.objects.count(),
        },
    }
