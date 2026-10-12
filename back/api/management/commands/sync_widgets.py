import json
from pathlib import Path

from django.core.management.base import BaseCommand

from api.models import Widget

MANIFEST = Path(__file__).resolve().parents[2] / "widgets_manifest.json"


class Command(BaseCommand):
    help = (
        "Crea en la BD los widgets declarados en api/widgets_manifest.json "
        "(idempotente; no pisa widgets existentes ni borra ninguno)."
    )

    def handle(self, *args, **options):
        if not MANIFEST.exists():
            self.stdout.write("Sin manifiesto de widgets; nada que sincronizar.")
            return

        for entry in json.loads(MANIFEST.read_text(encoding="utf-8")):
            tipo = entry["tipo"]
            _, created = Widget.objects.get_or_create(
                tipo=tipo,
                defaults={
                    "nombre": entry.get("nombre", tipo.capitalize()),
                    "col_tam_default": entry.get("col_tam_default", 4),
                    "fila_tam_default": entry.get("fila_tam_default", 2),
                    "activo": True,
                },
            )
            self.stdout.write(f"{'Creado' if created else 'Ya existe'}: {tipo}")
