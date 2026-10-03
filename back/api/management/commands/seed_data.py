from datetime import date, datetime, time, timedelta
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import (
    Carrera,
    HorarioCursado,
    Materia,
    Noticias,
    Plantilla,
    PlantillaWidget,
    Widget,
)


class Command(BaseCommand):
    help = "Carga datos de prueba en la base de datos"

    def handle(self, *args, **options):
        self.stdout.write("Cargando datos de prueba...")

        call_command("seed_academico")

        # ── Noticias ──
        if not Noticias.objects.exists():
            hoy = date.today()
            Noticias.objects.create(
                titulo="Inscripciones 2do Cuatrimestre 2026",
                contenido="Las inscripciones para el segundo cuatrimestre estaran abiertas del 15 al 30 de julio.",
                fecha_publicacion=timezone.make_aware(datetime.combine(hoy, time(8, 0))),
                fecha_expiracion=timezone.make_aware(
                    datetime.combine(hoy + timedelta(days=60), time(23, 59))
                ),
            )

        # ── Widgets ──
        widgets_data = [
            ("Horarios", "horarios", 4, 2),
            ("Examenes", "examenes", 4, 2),
            ("Calendario", "calendario", 2, 2),
            ("Mapa", "mapa", 2, 2),
            ("Noticias", "noticias", 4, 2),
            ("Eventos", "novedades", 4, 2),
        ]
        for nombre, tipo, col_tam, fila_tam in widgets_data:
            Widget.objects.get_or_create(
                tipo=tipo,
                defaults={
                    "nombre": nombre,
                    "col_tam_default": col_tam,
                    "fila_tam_default": fila_tam,
                    "activo": True,
                },
            )

        if not Plantilla.objects.exists():
            plantilla = Plantilla.objects.create(nombre="Plantilla por defecto")
            disposicion = [
                ("horarios", 0, 0, 4, 2),
                ("examenes", 0, 2, 4, 2),
                ("calendario", 0, 4, 2, 2),
                ("mapa", 2, 4, 2, 2),
            ]
            for tipo, col_pos, fila_pos, col_tam, fila_tam in disposicion:
                widget = Widget.objects.get(tipo=tipo)
                PlantillaWidget.objects.create(
                    plantilla=plantilla,
                    widget=widget,
                    col_pos=col_pos,
                    fila_pos=fila_pos,
                    col_tam=col_tam,
                    fila_tam=fila_tam,
                )

        # ── Usuario admin ──
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@frre.utn.edu.ar", "admin123")

        self.stdout.write(
            self.style.SUCCESS(
                f"Datos cargados: {Carrera.objects.count()} carreras, "
                f"{Materia.objects.count()} materias, "
                f"{HorarioCursado.objects.count()} horarios"
            )
        )
