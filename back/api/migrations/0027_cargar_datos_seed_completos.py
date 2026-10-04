from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0026_alter_planmateria_plan_estudio"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
