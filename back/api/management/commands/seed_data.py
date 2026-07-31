from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Carrera, Materia, CarreraMateria, Espacio, HorarioCursado, MesaExamen, ActividadExtra, Suspension, Noticias, Widget, Plantilla, PlantillaWidget
from datetime import time, date, datetime, timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = "Carga datos de prueba en la base de datos"

    def handle(self, *args, **options):
        self.stdout.write("Cargando datos de prueba...")

        if Espacio.objects.exists():
            self.stdout.write("Ya hay datos cargados. Omitiendo.")
            return

        aulas = []
        for piso in range(1, 4):
            for num in ["A", "B", "C"]:
                e = Espacio.objects.create(
                    nombre=f"Aula {piso}{num}",
                    tipo="aula",
                    piso=piso,
                    capacidad=30 + num.__hash__() % 20,
                )
                aulas.append(e)

        lab = Espacio.objects.create(nombre="Laboratorio de Informática", tipo="laboratorio", piso=2, capacidad=25)
        dep = Espacio.objects.create(nombre="Departamento de Sistemas", tipo="departamento", piso=3, capacidad=0)
        ofi = Espacio.objects.create(nombre="Oficina de Alumnos", tipo="oficina", piso=1, capacidad=0)
        for e in [lab, dep, ofi]:
            aulas.append(e)

        c1 = Carrera.objects.create(nombre="Ingeniería en Sistemas de Información", codigo="ISI")
        c2 = Carrera.objects.create(nombre="Ingeniería Electrónica", codigo="IE")
        c3 = Carrera.objects.create(nombre="Licenciatura en Administración Rural", codigo="LAR")

        materias_data = [
            ("Matemática Discreta", "MD", "Ing. Pérez"),
            ("Álgebra y Geometría Analítica", "AGA", "Lic. González"),
            ("Análisis Matemático I", "AM1", "Ing. Rodríguez"),
            ("Programación I", "P1", "Lic. Martínez"),
            ("Sistemas de Representación", "SR", "Arq. Fernández"),
            ("Química General", "QG", "Ing. López"),
            ("Análisis Matemático II", "AM2", "Ing. Rodríguez"),
            ("Física I", "F1", "Ing. Díaz"),
            ("Programación II", "P2", "Lic. Martínez"),
            ("Base de Datos I", "BD1", "Ing. García"),
            ("Ingeniería de Software", "IS", "Ing. Pérez"),
            ("Redes de Datos", "RD", "Ing. Sánchez"),
            ("Electrónica General", "EG", "Ing. López"),
            ("Circuitos Eléctricos", "CE", "Ing. Díaz"),
            ("Administración de Empresas", "AE", "Lic. Fernández"),
        ]

        materias = []
        for nombre, cod, prof in materias_data:
            m = Materia.objects.create(nombre=nombre, codigo=cod, profesores=prof)
            materias.append(m)

        CarreraMateria.objects.create(carrera=c1, materia=materias[0], anio_plan=1, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[1], anio_plan=1, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[2], anio_plan=1, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[3], anio_plan=1, cuatrimestre=2)
        CarreraMateria.objects.create(carrera=c1, materia=materias[4], anio_plan=1, cuatrimestre=2)
        CarreraMateria.objects.create(carrera=c1, materia=materias[5], anio_plan=1, cuatrimestre=2)
        CarreraMateria.objects.create(carrera=c1, materia=materias[6], anio_plan=2, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[7], anio_plan=2, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[8], anio_plan=2, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[9], anio_plan=2, cuatrimestre=2)
        CarreraMateria.objects.create(carrera=c1, materia=materias[10], anio_plan=3, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c1, materia=materias[11], anio_plan=3, cuatrimestre=2)
        CarreraMateria.objects.create(carrera=c2, materia=materias[12], anio_plan=1, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c2, materia=materias[13], anio_plan=1, cuatrimestre=1)
        CarreraMateria.objects.create(carrera=c3, materia=materias[14], anio_plan=1, cuatrimestre=1)

        dias = ["lunes", "martes", "miercoles", "jueves", "viernes"]
        hoy = date.today()
        inicio_cuatri = hoy - timedelta(days=30)
        fin_cuatri = hoy + timedelta(days=120)

        for i, m in enumerate(materias[:8]):
            dia = dias[i % len(dias)]
            horario = HorarioCursado.objects.create(
                materia=m,
                espacio=aulas[i % len(aulas)],
                dia_semana=dia,
                comision=f"COM-{i%3+1}",
                hora_inicio=time(8 + i % 4, 0),
                hora_fin=time(10 + i % 4, 0),
                fecha_inicio_vigencia=inicio_cuatri,
                fecha_fin_vigencia=fin_cuatri,
                activo=True,
            )

        for i, m in enumerate(materias[:6]):
            mesa = MesaExamen.objects.create(
                materia=m,
                espacio=aulas[i % len(aulas)],
                fecha_hora=timezone.make_aware(datetime.combine(hoy + timedelta(days=15 + i*7), time(9, 0))),
                turno=["febrero", "julio", "diciembre"][i % 3],
                llamado=1 + i % 2,
                tribunal=f"Prof. {['Pérez', 'González', 'Rodríguez', 'Martínez'][i%4]}, Prof. {['López', 'Díaz', 'Fernández', 'García'][i%4]}",
                activo=True,
            )

        act1 = ActividadExtra.objects.create(
            titulo="Taller de Introducción a la IA",
            tipo="taller",
            descripcion="Taller práctico de introducción a inteligencia artificial con Python.",
            fecha_hora_inicio=timezone.make_aware(datetime.combine(hoy + timedelta(days=7), time(14, 0))),
            fecha_hora_fin=timezone.make_aware(datetime.combine(hoy + timedelta(days=7), time(17, 0))),
            espacio=aulas[0],
        )
        act2 = ActividadExtra.objects.create(
            titulo="Charla: Salidas Laborales en IT",
            tipo="charla",
            descripcion="Charla informativa sobre oportunidades laborales en el sector tecnológico.",
            fecha_hora_inicio=timezone.make_aware(datetime.combine(hoy + timedelta(days=14), time(10, 0))),
            fecha_hora_fin=timezone.make_aware(datetime.combine(hoy + timedelta(days=14), time(12, 0))),
            espacio=aulas[1],
        )

        Suspension.objects.create(
            horario_cursado=HorarioCursado.objects.first(),
            fecha=hoy + timedelta(days=2),
            motivo="Paro docente convocado por gremio",
            tipo="paro",
        )
        Suspension.objects.create(
            actividad_extra=act2,
            fecha=hoy + timedelta(days=14),
            motivo="Feriado nacional",
            tipo="feriado",
        )

        Noticias.objects.create(
            titulo="Inscripciones 2do Cuatrimestre 2026",
            contenido="Las inscripciones para el segundo cuatrimestre estarán abiertas del 15 al 30 de julio. Dirigirse a la Oficina de Alumnos.",
            fecha_publicacion=timezone.make_aware(datetime.combine(hoy, time(8, 0))),
            fecha_expiracion=timezone.make_aware(datetime.combine(hoy + timedelta(days=60), time(23, 59))),
        )
        Noticias.objects.create(
            titulo="Nuevo Laboratorio de Informática",
            contenido="Se inauguró el nuevo laboratorio con 25 computadoras en el 2do piso. Ya disponible para uso de alumnos.",
            fecha_publicacion=timezone.make_aware(datetime.combine(hoy - timedelta(days=5), time(10, 0))),
            fecha_expiracion=None,
        )

        widgets_data = [
            ("Horarios", "horarios", 2, 2),
            ("Exámenes", "examenes", 2, 2),
            ("Calendario", "calendario", 2, 2),
            ("Mapa", "mapa", 2, 2),
        ]
        for nombre, tipo, col_tam, fila_tam in widgets_data:
            Widget.objects.get_or_create(
                tipo=tipo,
                defaults={"nombre": nombre, "col_tam_default": col_tam, "fila_tam_default": fila_tam, "activo": True},
            )

        if not Plantilla.objects.exists():
            plantilla = Plantilla.objects.create(
                nombre="Plantilla por defecto",
            )
            disposicion = [
                ("horarios", 0, 0),
                ("examenes", 2, 0),
                ("calendario", 0, 2),
                ("mapa", 2, 2),
            ]
            for tipo, col_pos, fila_pos in disposicion:
                widget = Widget.objects.get(tipo=tipo)
                PlantillaWidget.objects.create(
                    plantilla=plantilla,
                    widget=widget,
                    col_pos=col_pos,
                    fila_pos=fila_pos,
                    col_tam=2,
                    fila_tam=2,
                )

        self.stdout.write(self.style.SUCCESS(
            f"Datos cargados: {Carrera.objects.count()} carreras, {Materia.objects.count()} materias, "
            f"{Espacio.objects.count()} espacios, {HorarioCursado.objects.count()} horarios, "
            f"{MesaExamen.objects.count()} mesas de examen, {ActividadExtra.objects.count()} eventos, "
            f"{Suspension.objects.count()} suspensiones, {Noticias.objects.count()} noticias, "
            f"{Widget.objects.count()} widgets, {Plantilla.objects.count()} plantillas"
        ))
