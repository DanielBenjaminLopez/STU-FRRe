import csv
from pathlib import Path

from django.db import migrations


CSV_DIR = Path(__file__).resolve().parents[1] / "seed"


def rows(filename):
    with (CSV_DIR / filename).open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))


def load_seed(apps, schema_editor):
    Espacio = apps.get_model("api", "Espacio")
    Carrera = apps.get_model("api", "Carrera")
    Materia = apps.get_model("api", "Materia")
    PlanMateria = apps.get_model("api", "PlanMateria")
    Comision = apps.get_model("api", "Comision")
    HorarioCursado = apps.get_model("api", "HorarioCursado")

    # 1. Espacios: los horarios referencian estos registros.
    for row in rows("Datos ISI - Espacio.csv"):
        Espacio.objects.update_or_create(
            nombre=row["nombre"],
            defaults={
                "tipo": row["tipo"],
                "tipo_otro": row["tipo_otro"] or "",
                "piso": row["piso"],
            },
        )

    # 2. Carreras: los planes referencian la carrera.
    tipo_carrera = {
        "Grado": "grado",
        "Tecnicatura": "tecnica",
        "Posgrado": "posgrado",
        "Diplomatura": "diplomatura",
    }
    for row in rows("Datos ISI - Carrera.csv"):
        Carrera.objects.update_or_create(
            codigo=row["codigo"],
            defaults={"nombre": row["nombre"], "tipo": tipo_carrera[row["tipo"]]},
        )

    # 3. Materias: los planes referencian la materia.
    for row in rows("Datos ISI - Materia.csv"):
        Materia.objects.get_or_create(nombre=row["nombre"])

    # 4. Planes: se identifica cada plan por carrera, materia y plan de estudio.
    planes = {}
    for row in rows("Datos ISI - Plan.csv"):
        carrera = Carrera.objects.get(nombre=row["carrera"])
        materia = Materia.objects.get(nombre=row["materia"])
        plan, _ = PlanMateria.objects.update_or_create(
            carrera=carrera,
            materia=materia,
            nivel=row["nivel"],
            plan_estudio=row["plan_estudio"],
            defaults={
                "modalidad": row["modalidad"],
                "cuatrimestre": row["cuatrimestre"] or None,
            },
        )
        planes[(row["carrera"], row["materia"], row["plan_estudio"])] = plan

    # 5. Comisiones: los horarios referencian la comisión.
    comisiones = {}
    for row in rows("Datos ISI - Comisiones.csv"):
        plan = planes[(row["carrera"], row["materia"], "2023")]
        comision, _ = Comision.objects.update_or_create(
            plan_materia=plan,
            nombre=row["nombre"],
        )
        comisiones[(row["carrera"], row["materia"], row["nombre"])] = comision

    # 6. Horarios: todas sus claves foráneas ya fueron cargadas.
    dias = {
        "Lunes": "lunes",
        "Martes": "martes",
        "Miércoles": "miercoles",
        "Jueves": "jueves",
        "Viernes": "viernes",
        "Sábado": "sabado",
    }
    for row in rows("Datos ISI - Horarios.csv"):
        comision = comisiones[
            (row["carrera"], row["materia"], row["comision_nombre"])
        ]
        espacio = Espacio.objects.get(nombre=row["espacio"])
        HorarioCursado.objects.update_or_create(
            comision=comision,
            espacio=espacio,
            dia_semana=dias[row["dia_semana"]],
            hora_inicio=row["hora_inicio"],
            hora_fin=row["hora_fin"],
            defaults={"activo": row["activo"].strip().lower() == "true"},
        )


class Migration(migrations.Migration):
    dependencies = [("api", "0019_merge_20260807_2045")]

    operations = [migrations.RunPython(load_seed, migrations.RunPython.noop)]
