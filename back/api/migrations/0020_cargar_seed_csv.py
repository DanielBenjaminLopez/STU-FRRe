from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("api", "0019_merge_20260807_2045")]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop)
    ]
