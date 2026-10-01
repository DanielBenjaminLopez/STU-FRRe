import csv
from pathlib import Path
from django.db import migrations

CSV_DIR = Path(__file__).resolve().parent.parent / "seed"


def poblar_edificios_anexo(apps, schema_editor):
    if not CSV_DIR.exists():
        return
    Espacio = apps.get_model('api', 'Espacio')
    csv_files = list(CSV_DIR.glob("*espacio*.csv")) + list(CSV_DIR.glob("*Espacio*.csv"))
    for csv_file in csv_files:
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    nombre = (row.get('nombre') or '').strip()
                    edificio = (row.get('edificio') or '').strip().lower()
                    if nombre and edificio == 'anexo':
                        Espacio.objects.filter(nombre=nombre).update(edificio='anexo')
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_alter_espacio_options_espacio_edificio'),
    ]

    operations = [
        migrations.RunPython(poblar_edificios_anexo, migrations.RunPython.noop),
    ]
