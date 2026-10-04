from django.db import migrations
from api.seed.loader import cargar_seed_academico


def ejecutar_seed(apps, schema_editor):
    Carrera = apps.get_model("api", "Carrera")
    Materia = apps.get_model("api", "Materia")
    HorarioCursado = apps.get_model("api", "HorarioCursado")
    MesaExamen = apps.get_model("api", "MesaExamen")
    cargar_seed_academico(Carrera, Materia, HorarioCursado, MesaExamen)


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0038_simplificar_materias_comisiones_horarios"),
    ]

    operations = [
        migrations.RunPython(ejecutar_seed, migrations.RunPython.noop),
    ]
