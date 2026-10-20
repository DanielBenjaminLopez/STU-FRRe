"""
Migración de datos idempotente: sanea UbicacionMapa para que todos los
espacios del plano tengan identificadores puramente numéricos (1 al 74).

- Planta Baja (`baja`): renombra los huérfanos históricos (36/sn1 -> 69,
  37/sn3 -> 70, 38/sn4 -> 71) preservando ediciones previas de nombre o tipo.
- Primer Piso (`primero`): migra los códigos anteriores (sn6 -> 72,
  sn7 -> 73, terraza -> 74) o los crea si no existen.
"""
from django.db import migrations


# Mapeo de identificadores anteriores a los nuevos IDs numéricos
MAPEO_BAJA = {
    "69": ["36", "sn1"],
    "70": ["37", "sn3"],
    "71": ["38", "sn4"],
}

MAPEO_PRIMERO = {
    "72": ["sn6"],
    "73": ["sn7"],
    "74": ["terraza"],
}


def sanear_ubicaciones_mapa(apps, schema_editor):
    UbicacionMapa = apps.get_model("api", "UbicacionMapa")

    # 1. Planta Baja -> 69, 70, 71
    for new_id, old_ids in MAPEO_BAJA.items():
        new_obj = UbicacionMapa.objects.filter(piso="baja", svg_id=new_id).first()
        old_obj = UbicacionMapa.objects.filter(piso="baja", svg_id__in=old_ids).first()

        if old_obj and not new_obj:
            old_obj.svg_id = new_id
            old_obj.save(update_fields=["svg_id"])
        elif old_obj and new_obj:
            old_obj.delete()

        UbicacionMapa.objects.get_or_create(
            piso="baja",
            svg_id=new_id,
            defaults={"nombre": "Sin nombre", "tipo": "otro"},
        )

    # 2. Primer Piso -> 72, 73, 74
    for new_id, old_ids in MAPEO_PRIMERO.items():
        new_obj = UbicacionMapa.objects.filter(piso="primero", svg_id=new_id).first()
        old_obj = UbicacionMapa.objects.filter(piso="primero", svg_id__in=old_ids).first()

        if old_obj and not new_obj:
            old_obj.svg_id = new_id
            old_obj.save(update_fields=["svg_id"])
        elif old_obj and new_obj:
            old_obj.delete()

        default_nombre = "Terraza" if new_id == "74" else "Sin nombre"
        UbicacionMapa.objects.get_or_create(
            piso="primero",
            svg_id=new_id,
            defaults={"nombre": default_nombre, "tipo": "otro"},
        )


def revertir_saneo_ubicaciones_mapa(apps, schema_editor):
    UbicacionMapa = apps.get_model("api", "UbicacionMapa")

    for new_id in ["69", "70", "71"]:
        UbicacionMapa.objects.filter(piso="baja", svg_id=new_id).delete()

    for new_id in ["72", "73", "74"]:
        UbicacionMapa.objects.filter(piso="primero", svg_id=new_id).delete()


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
