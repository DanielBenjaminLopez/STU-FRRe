from django.core.management.base import BaseCommand
from api.models import (
    Carrera, Materia, HorarioCursado,
)
from datetime import time


class Command(BaseCommand):
    help = "Corrige niveles y materias en la DB existente (sin borrar noticias/widgets)"

    def handle(self, *args, **options):
        self.stdout.write("Corrigiendo datos de academico...")

        # ── Borrar solo datos académicos ──
        horarios_borrados = HorarioCursado.objects.count()
        materias_borradas = Materia.objects.count()

        HorarioCursado.objects.all().delete()
        Materia.objects.all().delete()

        self.stdout.write(f"  Borrados: {horarios_borrados} horarios, {materias_borradas} materias")

        aulas = ["Aula 1A", "Aula 1B", "Aula 1C"]

        # ── Carreras (ya existen con tipo correcto) ──
        carreras = {c.nombre: c for c in Carrera.objects.all()}

        # ── Materias por carrera con niveles correctos ──
        horarios_data = [
            ("lunes", time(8, 0), time(10, 0)),
            ("martes", time(10, 15), time(12, 15)),
            ("miercoles", time(8, 0), time(10, 0)),
            ("jueves", time(14, 0), time(16, 0)),
            ("viernes", time(10, 15), time(12, 15)),
        ]

        def crear_plan(carrera, materia_nombre, nivel, _plan, comisiones_data):
            m = Materia.objects.create(
                carrera=carrera, nombre=materia_nombre, nivel=nivel,
            )
            for com_nombre, horarios in comisiones_data:
                for dia, inicio, fin in horarios:
                    HorarioCursado.objects.create(
                        materia=m, comision=com_nombre, espacio=aulas[0], dia_semana=dia,
                        hora_inicio=inicio, hora_fin=fin,
                    )

        # ── ISI (5 niveles, anual) ──
        isi = carreras.get("Ingenieria en Sistemas de Informacion")
        if isi:
            m = ["Analisis Matematico I", "Analisis Matematico II", "Algebra y Geometria Analitica", "Programacion I", "Programacion II"]
            crear_plan(isi, m[0], "primero", "2023", [("K1", [horarios_data[0], horarios_data[2]]), ("K2", [horarios_data[1], horarios_data[3]])])
            crear_plan(isi, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(isi, m[2], "tercero", "2023", [("K1", [horarios_data[0], horarios_data[3]])])
            crear_plan(isi, m[3], "cuarto", "2023", [("Unica", [horarios_data[2], horarios_data[4]])])
            crear_plan(isi, m[4], "quinto", "2023", [("Unica", [horarios_data[0], horarios_data[1]])])

        # ── IQ (5 niveles, anual) ──
        iq = carreras.get("Ingenieria Quimica")
        if iq:
            m = ["Quimica General", "Analisis Matematico I para IQ", "Fisica I para IQ", "Quimica Organica", "Termodinamica Quimica"]
            crear_plan(iq, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(iq, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(iq, m[2], "tercero", "2023", [("Unica", [horarios_data[3]])])
            crear_plan(iq, m[3], "cuarto", "2023", [("Unica", [horarios_data[0], horarios_data[4]])])
            crear_plan(iq, m[4], "quinto", "2023", [("Unica", [horarios_data[2], horarios_data[3]])])

        # ── IEM (5 niveles, anual) ──
        iem = carreras.get("Ingenieria Electromecanica")
        if iem:
            m = ["Circuitos Electricos", "Termodinamica", "Resistencia de Materiales", "Electrotecnia", "Automatica I"]
            crear_plan(iem, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[3]])])
            crear_plan(iem, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(iem, m[2], "tercero", "2023", [("Unica", [horarios_data[2]])])
            crear_plan(iem, m[3], "cuarto", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(iem, m[4], "quinto", "2023", [("Unica", [horarios_data[3], horarios_data[4]])])

        # ── LAR (5 niveles, cuatrimestral) ──
        lar = carreras.get("Licenciatura en Administracion Rural")
        if lar:
            m = ["Administracion de Empresas", "Economia Rural", "Contabilidad Basica", "Gestion de Recursos Humanos", "Marketing Rural"]
            crear_plan(lar, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(lar, m[1], "segundo", "2023", [("Unica", [horarios_data[1]])])
            crear_plan(lar, m[2], "tercero", "2023", [("Unica", [horarios_data[3], horarios_data[4]])])
            crear_plan(lar, m[3], "cuarto", "2023", [("Unica", [horarios_data[0], horarios_data[1]])])
            crear_plan(lar, m[4], "quinto", "2023", [("Unica", [horarios_data[2], horarios_data[3]])])

        # ── TUP (3 niveles, cuatrimestral) ──
        tup = carreras.get("Tecnicatura Universitaria en Programacion")
        if tup:
            m = ["Introduccion a la Programacion", "Logica de Programacion", "Base de Datos"]
            crear_plan(tup, m[0], "primero", "2023", [("K1", [horarios_data[0], horarios_data[2]]), ("K2", [horarios_data[1], horarios_data[3]])])
            crear_plan(tup, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(tup, m[2], "tercero", "2023", [("Unica", [horarios_data[0], horarios_data[3]])])

        # ── TUM (3 niveles, cuatrimestral) ──
        tum = carreras.get("Tecnicatura Universitaria en Mecatronica")
        if tum:
            m = ["Mecatronica I", "Automatica I", "Robotica Basica"]
            crear_plan(tum, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(tum, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(tum, m[2], "tercero", "2023", [("Unica", [horarios_data[3]])])

        # ── TUOMRE (3 niveles, cuatrimestral) ──
        tuomre = carreras.get("Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Electricas")
        if tuomre:
            m = ["Redes Electricas I", "Mantenimiento Industrial", "Seguridad Electrica"]
            crear_plan(tuomre, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[3]])])
            crear_plan(tuomre, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(tuomre, m[2], "tercero", "2023", [("Unica", [horarios_data[2]])])

        # ── TUL (3 niveles, cuatrimestral) ──
        tul = carreras.get("Tecnicatura Universitaria en Logistica")
        if tul:
            m = ["Gestion de Cadena de Suministro", "Logistica y Transporte", "Almacenamiento y Distribucion"]
            crear_plan(tul, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(tul, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[3]])])
            crear_plan(tul, m[2], "tercero", "2023", [("Unica", [horarios_data[4]])])

        # ── TUPaD (3 niveles, cuatrimestral) ──
        tupad = carreras.get("Tecnicatura Universitaria en Programacion a Distancia")
        if tupad:
            m = ["Programacion Web I", "Programacion Web II", "Desarrollo Movil"]
            crear_plan(tupad, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(tupad, m[1], "segundo", "2023", [("Unica", [horarios_data[1], horarios_data[4]])])
            crear_plan(tupad, m[2], "tercero", "2023", [("Unica", [horarios_data[3]])])

        # ── DI (2 niveles, anual) ──
        di = carreras.get("Doctorado en Informatica")
        if di:
            m = ["Investigacion en Informatica", "Seminario de Doctorado"]
            crear_plan(di, m[0], "primero", "2023", [("Unica", [horarios_data[0]])])
            crear_plan(di, m[1], "segundo", "2023", [("Unica", [horarios_data[2]])])

        # ── EHYST (2 niveles, cuatrimestral) ──
        ehyst = carreras.get("Especializacion en Higiene y Seguridad en el Trabajo")
        if ehyst:
            m = ["Seguridad e Higiene Industrial", "Legislacion Laboral"]
            crear_plan(ehyst, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[2]])])
            crear_plan(ehyst, m[1], "segundo", "2023", [("Unica", [horarios_data[1]])])

        # ── EIG (2 niveles, cuatrimestral) ──
        eig = carreras.get("Especializacion en Ingenieria Gerencial")
        if eig:
            m = ["Gestion de Proyectos", "Liderazgo Organizacional"]
            crear_plan(eig, m[0], "primero", "2023", [("Unica", [horarios_data[0], horarios_data[3]])])
            crear_plan(eig, m[1], "segundo", "2023", [("Unica", [horarios_data[1]])])

        # ── DTIE (2 niveles, cuatrimestral) ──
        dtie = carreras.get("Diplomatura en Tecnologias Inclusivas en Educacion")
        if dtie:
            m = ["Tecnologias Asistivas", "Educacion Inclusiva"]
            crear_plan(dtie, m[0], "primero", "2023", [("Unica", [horarios_data[0]])])
            crear_plan(dtie, m[1], "segundo", "2023", [("Unica", [horarios_data[2], horarios_data[4]])])

        self.stdout.write(self.style.SUCCESS(
            f"Corregido: {Materia.objects.count()} materias, "
            f"{HorarioCursado.objects.count()} horarios"
        ))
