"""
Migración de datos idempotente: sanea UbicacionMapa para alinear la BD
con los identificadores reales de los archivos SVG del mapa interactivo.

- Planta Baja (`baja`): renombra los huérfanos `36 -> sn1`, `37 -> sn3`, `38 -> sn4`
  preservando cualquier edición previa de `nombre` o `tipo`, o los crea si faltan.
- Primer Piso (`primero`): agrega los polígonos faltantes `sn6`, `sn7` y `terraza`
  sin pisar registros existentes.
"""
from django.db import migrations


MAPEO_BAJA = {
    "36": "sn1",
    "37": "sn3",
    "38": "sn4",
}

FALTANTES_PRIMERO = {
    "sn6": {"nombre": "Sin nombre", "tipo": "otro"},
    "sn7": {"nombre": "Sin nombre", "tipo": "otro"},
    "terraza": {"nombre": "Terraza", "tipo": "otro"},
}


def sanear_ubicaciones_mapa(apps, schema_editor):
    UbicacionMapa = apps.get_model("api", "UbicacionMapa")

    for old_id, new_id in MAPEO_BAJA.items():
        old_obj = UbicacionMapa.objects.filter(piso="baja", svg_id=old_id).first()
        new_exists = UbicacionMapa.objects.filter(piso="baja", svg_id=new_id).exists()

        if old_obj and not new_exists:
            old_obj.svg_id = new_id
            old_obj.save(update_fields=["svg_id"])
        elif old_obj and new_exists:
            old_obj.delete()

        UbicacionMapa.objects.get_or_create(
            piso="baja",
            svg_id=new_id,
            defaults={"nombre": "Sin nombre", "tipo": "otro"},
        )

    for svg_id, defaults in FALTANTES_PRIMERO.items():
        UbicacionMapa.objects.get_or_create(
            piso="primero",
            svg_id=svg_id,
            defaults=defaults,
        )


def revertir_saneo_ubicaciones_mapa(apps, schema_editor):
    UbicacionMapa = apps.get_model("api", "UbicacionMapa")

    for old_id, new_id in MAPEO_BAJA.items():
        new_obj = UbicacionMapa.objects.filter(piso="baja", svg_id=new_id).first()
        old_exists = UbicacionMapa.objects.filter(piso="baja", svg_id=old_id).exists()

        if new_obj and not old_exists:
            new_obj.svg_id = old_id
            new_obj.save(update_fields=["svg_id"])
        elif new_obj and old_exists:
            new_obj.delete()

    UbicacionMapa.objects.filter(
        piso="primero", svg_id__in=list(FALTANTES_PRIMERO.keys())
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0040_simplificar_mesa_examen"),
    ]

    operations = [
        migrations.RunPython(
            sanear_ubicaciones_mapa,
            revertir_saneo_ubicaciones_mapa,
        ),
    ]
