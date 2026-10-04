from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Carrera, HorarioCursado, Materia, MesaExamen
from api.seed.loader import cargar_seed_academico


class Command(BaseCommand):
    help = "Elimina los datos académicos actuales y carga carreras, materias y horarios desde api/seed/*.csv"

    def handle(self, *args, **options):
        self.stdout.write("═══ Seed Académico ═══")

        with transaction.atomic():
            resultado = cargar_seed_academico(
                Carrera, Materia, HorarioCursado, MesaExamen
            )

        if not resultado:
            self.stdout.write(
                self.style.WARNING("No se encontraron los archivos CSV en api/seed/.")
            )
            return

        elim = resultado["eliminados"]
        creados = resultado["creados"]

        self.stdout.write(
            f"  Eliminados: {elim['carreras']} carreras, {elim['materias']} materias, "
            f"{elim['horarios']} horarios, {elim['mesas']} mesas de examen"
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"\n═══ Completado ═══\n"
                f"  Carreras: {creados['carreras']}\n"
                f"  Materias: {creados['materias']}\n"
                f"  Horarios: {creados['horarios']}"
            )
        )
