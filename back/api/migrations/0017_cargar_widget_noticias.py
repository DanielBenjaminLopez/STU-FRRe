from django.db import migrations


WIDGETS = [
    {"nombre": "Noticias", "tipo": "noticias", "col_tam_default": 4, "fila_tam_default": 2},
]


def forwards(apps, schema_editor):
    Widget = apps.get_model("api", "Widget")
    for widget in WIDGETS:
        Widget.objects.update_or_create(
            tipo=widget["tipo"],
            defaults=widget,
        )


def backwards(apps, schema_editor):
    Widget = apps.get_model("api", "Widget")
    tipos = [w["tipo"] for w in WIDGETS]
    Widget.objects.filter(tipo__in=tipos).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_eventocalendario"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
