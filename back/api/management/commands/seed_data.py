from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    Carrera, Materia, PlanMateria, Comision, HorarioCursado, Espacio,
    MesaExamen, Noticias, Widget, Plantilla, PlantillaWidget,
)
from datetime import time, date, datetime, timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = "Carga datos de prueba en la base de datos"

    def handle(self, *args, **options):
        self.stdout.write("Cargando datos de prueba...")

        if PlanMateria.objects.exists():
            self.stdout.write("Ya hay datos cargados. Omitiendo.")
            return

        # ── Espacios ──
        aulas = []
        for piso in range(1, 4):
            for num in ["A", "B", "C"]:
                e = Espacio.objects.create(
                    nombre=f"Aula {piso}{num}",
                    tipo="aula",
                    piso=piso,
                )
                aulas.append(e)

        lab = Espacio.objects.create(
            nombre="Laboratorio de Informatica", tipo="laboratorio_informatico", piso=2
        )
        aulas.append(lab)

        # ── Carreras ──
        carreras_data = [
            ("Ingenieria Quimica", "grado"),
            ("Ingenieria Electromecanica", "grado"),
            ("Licenciatura en Administracion Rural", "grado"),
            ("Ingenieria en Sistemas de Informacion", "grado"),
            ("Tecnicatura Universitaria en Programacion", "tecnica"),
            ("Tecnicatura Universitaria en Mecatronica", "tecnica"),
            ("Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Electricas", "tecnica"),
            ("Tecnicatura Universitaria en Logistica", "tecnica"),
            ("Tecnicatura Universitaria en Programacion a Distancia", "tecnica"),
            ("Doctorado en Informatica", "posgrado"),
            ("Especializacion en Higiene y Seguridad en el Trabajo", "posgrado"),
            ("Especializacion en Ingenieria Gerencial", "posgrado"),
            ("Diplomatura en Tecnologias Inclusivas en Educacion", "diplomatura"),
        ]
        carreras = {}
        for nombre, tipo in carreras_data:
            carreras[nombre] = Carrera.objects.create(nombre=nombre, tipo=tipo)

        c_isi = carreras["Ingenieria en Sistemas de Informacion"]
        c_iq = carreras["Ingenieria Quimica"]
        c_iem = carreras["Ingenieria Electromecanica"]
        c_lar = carreras["Licenciatura en Administracion Rural"]
        c_tup = carreras["Tecnicatura Universitaria en Programacion"]
        c_tum = carreras["Tecnicatura Universitaria en Mecatronica"]
        c_tuomre = carreras["Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Electricas"]
        c_tul = carreras["Tecnicatura Universitaria en Logistica"]
        c_tupad = carreras["Tecnicatura Universitaria en Programacion a Distancia"]
        c_di = carreras["Doctorado en Informatica"]
        c_ehyst = carreras["Especializacion en Higiene y Seguridad en el Trabajo"]
        c_eig = carreras["Especializacion en Ingenieria Gerencial"]
        c_dtie = carreras["Diplomatura en Tecnologias Inclusivas en Educacion"]

        # ── Materias ──
        def mat(nombre):
            materia, _ = Materia.objects.get_or_create(nombre=nombre)
            return materia

        # ISI - 5 materias (1 por nivel)
        materias_isi = [
            mat("Analisis Matematico I"),
            mat("Analisis Matematico II"),
            mat("Algebra y Geometria Analitica"),
            mat("Programacion I"),
            mat("Programacion II"),
        ]
        # IQ - 5 materias
        materias_iq = [
            mat("Quimica General"),
            mat("Analisis Matematico I para IQ"),
            mat("Fisica I para IQ"),
            mat("Quimica Organica"),
            mat("Termodinamica Quimica"),
        ]
        # IEM - 5 materias
        materias_iem = [
            mat("Circuitos Electricos"),
            mat("Termodinamica"),
            mat("Resistencia de Materiales"),
            mat("Electrotecnia"),
            mat("Automatica I"),
        ]
        # LAR - 5 materias
        materias_lar = [
            mat("Administracion de Empresas"),
            mat("Economia Rural"),
            mat("Contabilidad Basica"),
            mat("Gestion de Recursos Humanos"),
            mat("Marketing Rural"),
        ]
        # TUP - 3 materias (1 por nivel)
        materias_tup = [
            mat("Introduccion a la Programacion"),
            mat("Logica de Programacion"),
            mat("Base de Datos"),
        ]
        # TUM - 3 materias
        materias_tum = [
            mat("Mecatronica I"),
            mat("Automatica I"),
            mat("Robotica Basica"),
        ]
        # TUOMRE - 3 materias
        materias_tuomre = [
            mat("Redes Electricas I"),
            mat("Mantenimiento Industrial"),
            mat("Seguridad Electrica"),
        ]
        # TUL - 3 materias
        materias_tul = [
            mat("Gestion de Cadena de Suministro"),
            mat("Logistica y Transporte"),
            mat("Almacenamiento y Distribucion"),
        ]
        # TUPaD - 3 materias
        materias_tupad = [
            mat("Programacion Web I"),
            mat("Programacion Web II"),
            mat("Desarrollo Movil"),
        ]
        # DI - 2 materias
        materias_di = [
            mat("Investigacion en Informatica"),
            mat("Seminario de Doctorado"),
        ]
        # EHYST - 2 materias
        materias_ehyst = [
            mat("Seguridad e Higiene Industrial"),
            mat("Legislacion Laboral"),
        ]
        # EIG - 2 materias
        materias_eig = [
            mat("Gestion de Proyectos"),
            mat("Liderazgo Organizacional"),
        ]
        # DTIE - 2 materias
        materias_dtie = [
            mat("Tecnologias Asistivas"),
            mat("Educacion Inclusiva"),
        ]

        # ── PlanMaterias + Comisiones + Horarios ──
        horarios_data = [
            ("lunes", time(8, 0), time(10, 0)),
            ("martes", time(10, 15), time(12, 15)),
            ("miercoles", time(8, 0), time(10, 0)),
            ("jueves", time(14, 0), time(16, 0)),
            ("viernes", time(10, 15), time(12, 15)),
        ]

        def crear_plan(carrera, materia, nivel, modalidad, plan, comisiones_data):
            pm = PlanMateria.objects.create(
                carrera=carrera,
                materia=materia,
                nivel=nivel,
                modalidad=modalidad,
                cuatrimestre=None if modalidad == "anual" else "primero",
                plan_estudio=plan,
            )
            for com_nombre, horarios in comisiones_data:
                com = Comision.objects.create(plan_materia=pm, nombre=com_nombre)
                for dia, inicio, fin in horarios:
                    HorarioCursado.objects.create(
                        comision=com,
                        espacio=aulas[0],
                        dia_semana=dia,
                        hora_inicio=inicio,
                        hora_fin=fin,
                        activo=True,
                    )
            return pm

        # ── ISI (5 niveles, anual) ──
        crear_plan(c_isi, materias_isi[0], "primero", "anual", "2023",
                   [("K1", [horarios_data[0], horarios_data[2]]), ("K2", [horarios_data[1], horarios_data[3]])])
        crear_plan(c_isi, materias_isi[1], "segundo", "anual", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_isi, materias_isi[2], "tercero", "anual", "2023",
                   [("K1", [horarios_data[0], horarios_data[3]])])
        crear_plan(c_isi, materias_isi[3], "cuarto", "anual", "2023",
                   [("Unica", [horarios_data[2], horarios_data[4]])])
        crear_plan(c_isi, materias_isi[4], "quinto", "anual", "2023",
                   [("Unica", [horarios_data[0], horarios_data[1]])])

        # ── IQ (5 niveles, anual) ──
        crear_plan(c_iq, materias_iq[0], "primero", "anual", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_iq, materias_iq[1], "segundo", "anual", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_iq, materias_iq[2], "tercero", "anual", "2023",
                   [("Unica", [horarios_data[3]])])
        crear_plan(c_iq, materias_iq[3], "cuarto", "anual", "2023",
                   [("Unica", [horarios_data[0], horarios_data[4]])])
        crear_plan(c_iq, materias_iq[4], "quinto", "anual", "2023",
                   [("Unica", [horarios_data[2], horarios_data[3]])])

        # ── IEM (5 niveles, anual) ──
        crear_plan(c_iem, materias_iem[0], "primero", "anual", "2023",
                   [("Unica", [horarios_data[0], horarios_data[3]])])
        crear_plan(c_iem, materias_iem[1], "segundo", "anual", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_iem, materias_iem[2], "tercero", "anual", "2023",
                   [("Unica", [horarios_data[2]])])
        crear_plan(c_iem, materias_iem[3], "cuarto", "anual", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_iem, materias_iem[4], "quinto", "anual", "2023",
                   [("Unica", [horarios_data[3], horarios_data[4]])])

        # ── LAR (5 niveles, cuatrimestral) ──
        crear_plan(c_lar, materias_lar[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_lar, materias_lar[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1]])])
        crear_plan(c_lar, materias_lar[2], "tercero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[3], horarios_data[4]])])
        crear_plan(c_lar, materias_lar[3], "cuarto", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[1]])])
        crear_plan(c_lar, materias_lar[4], "quinto", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[2], horarios_data[3]])])

        # ── TUP (3 niveles, cuatrimestral) ──
        crear_plan(c_tup, materias_tup[0], "primero", "cuatrimestral", "2023",
                   [("K1", [horarios_data[0], horarios_data[2]]), ("K2", [horarios_data[1], horarios_data[3]])])
        crear_plan(c_tup, materias_tup[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_tup, materias_tup[2], "tercero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[3]])])

        # ── TUM (3 niveles, cuatrimestral) ──
        crear_plan(c_tum, materias_tum[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_tum, materias_tum[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_tum, materias_tum[2], "tercero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[3]])])

        # ── TUOMRE (3 niveles, cuatrimestral) ──
        crear_plan(c_tuomre, materias_tuomre[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[3]])])
        crear_plan(c_tuomre, materias_tuomre[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_tuomre, materias_tuomre[2], "tercero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[2]])])

        # ── TUL (3 niveles, cuatrimestral) ──
        crear_plan(c_tul, materias_tul[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_tul, materias_tul[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1], horarios_data[3]])])
        crear_plan(c_tul, materias_tul[2], "tercero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[4]])])

        # ── TUPaD (3 niveles, cuatrimestral) ──
        crear_plan(c_tupad, materias_tupad[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_tupad, materias_tupad[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1], horarios_data[4]])])
        crear_plan(c_tupad, materias_tupad[2], "tercero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[3]])])

        # ── DI (2 niveles, anual) ──
        crear_plan(c_di, materias_di[0], "primero", "anual", "2023",
                   [("Unica", [horarios_data[0]])])
        crear_plan(c_di, materias_di[1], "segundo", "anual", "2023",
                   [("Unica", [horarios_data[2]])])

        # ── EHYST (2 niveles, cuatrimestral) ──
        crear_plan(c_ehyst, materias_ehyst[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[2]])])
        crear_plan(c_ehyst, materias_ehyst[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1]])])

        # ── EIG (2 niveles, cuatrimestral) ──
        crear_plan(c_eig, materias_eig[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0], horarios_data[3]])])
        crear_plan(c_eig, materias_eig[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[1]])])

        # ── DTIE (2 niveles, cuatrimestral) ──
        crear_plan(c_dtie, materias_dtie[0], "primero", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[0]])])
        crear_plan(c_dtie, materias_dtie[1], "segundo", "cuatrimestral", "2023",
                   [("Unica", [horarios_data[2], horarios_data[4]])])

        # ── Noticias ──
        hoy = date.today()
        Noticias.objects.create(
            titulo="Inscripciones 2do Cuatrimestre 2026",
            contenido="Las inscripciones para el segundo cuatrimestre estaran abiertas del 15 al 30 de julio.",
            fecha_publicacion=timezone.make_aware(datetime.combine(hoy, time(8, 0))),
            fecha_expiracion=timezone.make_aware(datetime.combine(hoy + timedelta(days=60), time(23, 59))),
        )

        # ── Widgets ──
        widgets_data = [
            ("Horarios", "horarios", 4, 2),
            ("Examenes", "examenes", 4, 2),
            ("Calendario", "calendario", 2, 2),
            ("Mapa", "mapa", 2, 2),
        ]
        for nombre, tipo, col_tam, fila_tam in widgets_data:
            Widget.objects.get_or_create(
                tipo=tipo,
                defaults={"nombre": nombre, "col_tam_default": col_tam, "fila_tam_default": fila_tam, "activo": True},
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

        self.stdout.write(self.style.SUCCESS(
            f"Datos cargados: {Carrera.objects.count()} carreras, "
            f"{Materia.objects.count()} materias, {PlanMateria.objects.count()} planes, "
            f"{Comision.objects.count()} comisiones, {HorarioCursado.objects.count()} horarios, "
            f"{Espacio.objects.count()} espacios"
        ))
