"""
Migración idempotente:
1. Unifica todos los identificadores alfanuméricos remanentes (sn*, terraza,
   escaleras*, ascensor*, baño*) a números correlativos del 1 al 89 en los 3 pisos,
   preservando nombres y tipos editados. Re-ejecuta el saneo de 69..74 para entornos
   donde 0041 ya se había aplicado con su versión preliminar.
2. Aplica el validador numérico estricto sobre UbicacionMapa.svg_id.
"""
import django.core.validators
from django.db import migrations, models


MAPEO_POR_PISO = {
    "baja": {
        "69": (["36", "sn1"], {"nombre": "Sin nombre", "tipo": "otro"}),
        "70": (["37", "sn3"], {"nombre": "Sin nombre", "tipo": "otro"}),
        "71": (["38", "sn4"], {"nombre": "Sin nombre", "tipo": "otro"}),
        "75": (["escaleras1"], {"nombre": "Escalera Entrada a Primer Piso", "tipo": "escaleras"}),
        "76": (["escaleras2"], {"nombre": "Escalera Pasillo a Primer Piso", "tipo": "escaleras"}),
        "77": (["escaleras4"], {"nombre": "Escalera a Terraza", "tipo": "escaleras"}),
        "78": (["ascensor1"], {"nombre": "Ascensor", "tipo": "ascensor"}),
        "79": (["baño1"], {"nombre": "Baño Hombres", "tipo": "baños"}),
        "80": (["baño2"], {"nombre": "Baño Mujeres", "tipo": "baños"}),
    },
    "primero": {
        "72": (["sn6"], {"nombre": "Sin nombre", "tipo": "otro"}),
        "73": (["sn7"], {"nombre": "Sin nombre", "tipo": "otro"}),
        "74": (["terraza"], {"nombre": "Terraza", "tipo": "otro"}),
        "81": (["escaleras1"], {"nombre": "Escalera Entrada a Planta Baja", "tipo": "escaleras"}),
        "82": (["escaleras2"], {"nombre": "Escalera Pasillo a Planta Baja", "tipo": "escaleras"}),
        "83": (["escaleras3"], {"nombre": "Escalera Pasillo a Segundo Piso", "tipo": "escaleras"}),
        "84": (["escaleras4"], {"nombre": "Escalera Terraza a Planta Baja", "tipo": "escaleras"}),
        "85": (["ascensor1"], {"nombre": "Ascensor", "tipo": "ascensor"}),
        "86": (["baño3"], {"nombre": "Baño Hombres", "tipo": "baños"}),
    },
    "segundo": {
        "87": (["escaleras3"], {"nombre": "Escalera Pasillo a Primer Piso", "tipo": "escaleras"}),
        "88": (["ascensor1"], {"nombre": "Ascensor", "tipo": "ascensor"}),
        "89": (["baño4"], {"nombre": "Baño Mujeres", "tipo": "baños"}),
    },
}

IDS_VALIDOS_POR_PISO = {
    "baja": {str(i) for i in range(1, 36)} | {"69", "70", "71", "75", "76", "77", "78", "79", "80"},
    "primero": {str(i) for i in range(36, 57)} | {"72", "73", "74", "81", "82", "83", "84", "85", "86"},
    "segundo": {str(i) for i in range(57, 69)} | {"87", "88", "89"},
}


def unificar_ids_numericos(apps, schema_editor):
    UbicacionMapa = apps.get_model("api", "UbicacionMapa")

    for piso, mapeo in MAPEO_POR_PISO.items():
        for new_id, (old_ids, defaults) in mapeo.items():
            new_obj = UbicacionMapa.objects.filter(piso=piso, svg_id=new_id).first()
            old_objs = list(UbicacionMapa.objects.filter(piso=piso, svg_id__in=old_ids))

            if old_objs and not new_obj:
                primary = old_objs[0]
                for extra in old_objs[1:]:
                    extra.delete()
                primary.svg_id = new_id
                primary.save(update_fields=["svg_id"])
            elif old_objs and new_obj:
                for old_obj in old_objs:
                    old_obj.delete()

            UbicacionMapa.objects.get_or_create(
                piso=piso,
                svg_id=new_id,
                defaults=defaults,
            )

    for piso, valid_ids in IDS_VALIDOS_POR_PISO.items():
        UbicacionMapa.objects.filter(piso=piso).exclude(svg_id__in=valid_ids).delete()


def revertir_unificacion(apps, schema_editor):
    UbicacionMapa = apps.get_model("api", "UbicacionMapa")

    for piso, mapeo in MAPEO_POR_PISO.items():
        for new_id, (old_ids, _defaults) in mapeo.items():
            target_old = old_ids[0]
            new_obj = UbicacionMapa.objects.filter(piso=piso, svg_id=new_id).first()
            old_obj = UbicacionMapa.objects.filter(piso=piso, svg_id=target_old).first()
            if new_obj and not old_obj:
                new_obj.svg_id = target_old
                new_obj.save(update_fields=["svg_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0041_sanea_ubicaciones_mapa"),
    ]

    operations = [
        migrations.RunPython(
            unificar_ids_numericos,
            reverse_code=revertir_unificacion,
        ),
        migrations.AlterField(
            model_name="ubicacionmapa",
            name="svg_id",
            field=models.CharField(
                help_text='Identificador numérico del espacio/polígono en el SVG (ej: "1", "69").',
                max_length=50,
                validators=[
                    django.core.validators.RegexValidator(
                        message="El identificador del espacio en el mapa debe ser estrictamente numérico (solo dígitos).",
                        regex="^\\d+$",
                    )
                ],
            ),
        ),
    ]
