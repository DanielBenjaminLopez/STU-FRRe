import random
from datetime import time
from django.core.management.base import BaseCommand
from api.models import (
    Carrera, Materia, PlanMateria, Comision, HorarioCursado, Espacio,
)

# ── Espacios del mapa ──────────────────────────────────────────────
ESPACIOS_MAPA = [
    # Primer piso - Aulas
    ("Aula 1.1", "aula", "primer_piso"),
    ("Aula 1.2", "aula", "primer_piso"),
    ("Aula 1.3", "aula", "primer_piso"),
    ("Aula 1.4", "aula", "primer_piso"),
    ("Aula 1.5", "aula", "primer_piso"),
    ("Aula 1.6", "aula", "primer_piso"),
    # Primer piso - Aulas Informática
    ("Aula Informática 1", "aula", "primer_piso"),
    ("Aula Informática 2", "aula", "primer_piso"),
    ("Aula Informática 3", "aula", "primer_piso"),
    ("Aula Informática 4", "aula", "primer_piso"),
    ("Aula Informática 5", "aula", "primer_piso"),
    ("Aula Informática 6", "aula", "primer_piso"),
    # Primer piso - Especiales
    ("Aula Magna", "aula", "primer_piso"),
    ("Espacio Progresar", "aula", "primer_piso"),
    # Primer piso - Laboratorios
    ("G.I.E.S.IN", "laboratorio_informatico", "primer_piso"),
    ("G.I.Me.F. / G.I.LLAR", "laboratorio_informatico", "primer_piso"),
    ("Laboratorio de Radiosimetría", "laboratorio_informatico", "primer_piso"),
    ("GISTAQ", "laboratorio_informatico", "primer_piso"),
    # Segundo piso - Aulas
    ("Aula 2.1", "aula", "segundo_piso"),
    ("Aula 2.2", "aula", "segundo_piso"),
    ("Aula 2.3", "aula", "segundo_piso"),
    ("Aula 2.4", "aula", "segundo_piso"),
    ("Aula 2.5", "aula", "segundo_piso"),
    ("Aula 2.6", "aula", "segundo_piso"),
    ("Aula 2.8", "aula", "segundo_piso"),
    ("Aula 2.9", "aula", "segundo_piso"),
    ("Aula 2.10", "aula", "segundo_piso"),
    ("Aula 2.11", "aula", "segundo_piso"),
    # Planta baja - Laboratorio
    ("CinApTIC", "laboratorio_informatico", "planta_baja"),
]

# ── Franjas horarias ───────────────────────────────────────────────
FRANJAS_MANANA = [
    (time(8, 0), time(10, 0)),
    (time(10, 15), time(12, 15)),
]
FRANJAS_TARDE = [
    (time(14, 0), time(16, 0)),
    (time(16, 15), time(18, 15)),
]
FRANJAS_NOCHE = [
    (time(18, 30), time(20, 30)),
    (time(20, 30), time(22, 0)),
]

# Combinaciones de 2 días por semana
DIAS_COMBINACIONES = [
    [("lunes", "miercoles")],
    [("martes", "jueves")],
    [("lunes", "jueves")],
    [("martes", "viernes")],
]

# ── Materias por carrera ───────────────────────────────────────────

MATERIAS_ISI = {
    "primero": [
        "Análisis Matemático I",
        "Álgebra y Geometría Analítica",
        "Física I",
        "Inglés I",
        "Lógica y Estructuras Discretas",
        "Algoritmos y Estructuras de Datos",
        "Arquitectura de Computadoras",
        "Sistemas y Procesos de Negocio",
    ],
    "segundo": [
        "Análisis Matemático II",
        "Física II",
        "Ingeniería y Sociedad",
        "Inglés II",
        "Sintaxis y Semántica de los Lenguajes",
        "Paradigmas de Programación",
        "Sistemas Operativos",
        "Análisis de Sistemas de Información",
    ],
    "tercero": [
        "Probabilidad y Estadística",
        "Economía",
        "Bases de Datos",
        "Desarrollo de Software",
        "Comunicación de Datos",
        "Análisis Numérico",
        "Diseño de Sistemas de Información",
    ],
    "cuarto": [
        "Legislación",
        "Ingeniería y Calidad de Software",
        "Redes de Datos",
        "Investigación Operativa",
        "Simulación",
        "Tecnologías para la Automatización",
        "Administración de Sistemas de Información",
    ],
    "quinto": [
        "Inteligencia Artificial",
        "Ciencia de Datos",
        "Sistemas de Gestión",
        "Gestión Gerencial",
        "Seguridad en los Sistemas de Información",
        "Proyecto Final",
    ],
}

MATERIAS_IQ = {
    "primero": [
        "Introducción a la Ingeniería Química",
        "Ingeniería y Sociedad",
        "Álgebra y Geometría Analítica",
        "Análisis Matemático I",
        "Física I",
        "Química",
        "Sistemas de Representación",
        "Fundamentos de Informática",
    ],
    "segundo": [
        "Introducción a Equipos y Procesos",
        "Probabilidad y Estadística",
        "Química Inorgánica",
        "Análisis Matemático II",
        "Física II",
        "Química Orgánica",
        "Legislación",
        "Inglés I",
    ],
    "tercero": [
        "Balances de Masa y Energía",
        "Termodinámica",
        "Matemática Superior Aplicada",
        "Ciencia de los Materiales",
        "Fisicoquímica",
        "Fenómenos de Transporte",
        "Química Analítica",
        "Microbiología y Química Biológica",
        "Química Aplicada",
        "Inglés II",
    ],
    "cuarto": [
        "Diseño, Simulación, Optimización y Seguridad de Procesos",
        "Operaciones Unitarias I",
        "Tecnología de la Energía Térmica",
        "Economía",
        "Operaciones Unitarias II",
        "Ingeniería de las Reacciones Químicas",
        "Calidad y Control Estadístico de Procesos",
        "Organización Industrial",
    ],
    "quinto": [
        "Control Automático de Procesos",
        "Mecánica Industrial",
        "Ingeniería Ambiental",
        "Procesos Biotecnológicos",
        "Higiene y Seguridad en el Trabajo",
        "Máquinas e Instalaciones Eléctricas",
        "Proyecto Final",
    ],
}

MATERIAS_IEM = {
    "primero": [
        "Análisis Matemático I",
        "Química General",
        "Física I",
        "Ingeniería Electromecánica I",
        "Álgebra y Geometría Analítica",
        "Ingeniería y Sociedad",
        "Sistemas de Representación",
        "Representación Gráfica",
    ],
    "segundo": [
        "Física II",
        "Estabilidad",
        "Ingeniería Electromecánica II",
        "Conocimiento de Materiales",
        "Análisis Matemático II",
        "Programación en Computación",
        "Probabilidad y Estadística",
        "Inglés I",
    ],
    "tercero": [
        "Tecnología Mecánica",
        "Ingeniería Electromecánica III",
        "Mecánica y Mecanismos",
        "Electrotecnia",
        "Oleohidráulica y Neumática",
        "Termodinámica Técnica",
        "Matemática para Ingeniería Electromecánica",
        "Higiene y Seguridad Industrial",
        "Inglés II",
    ],
    "cuarto": [
        "Elementos de Máquinas",
        "Electrónica Industrial",
        "Mecánica de los Fluidos y Máquinas Fluidodinámicas",
        "Máquinas Eléctricas",
        "Mediciones Eléctricas",
        "Máquinas Térmicas",
        "Economía",
        "Legislación",
    ],
    "quinto": [
        "Redes de Distribución e Instalaciones Eléctricas",
        "Máquinas y Equipos de Transporte",
        "Instalaciones Térmicas y Mecánicas",
        "Centrales y Sistemas de Transmisión",
        "Gestión y Mantenimiento Electromecánico",
        "Organización Industrial",
        "Automatización y Control Industrial",
        "Proyecto Final",
    ],
}

MATERIAS_TUP = {
    "primero": [
        "Programación I",
        "Arquitectura y Sistemas Operativos",
        "Matemática",
        "Organización Empresarial",
    ],
    "segundo": [
        "Programación II",
        "Probabilidad y Estadística",
        "Base de Datos I",
        "Inglés I",
    ],
    "tercero": [
        "Programación III",
        "Base de Datos II",
        "Metodología de Sistemas I",
        "Inglés II",
    ],
    "cuarto": [
        "Programación IV",
        "Metodología de Sistemas II",
        "Introducción al Análisis de Datos",
        "Legislación",
        "Gestión de Desarrollo de Software",
        "Trabajo Final Integrador",
    ],
}

MATERIAS_LAR = {
    "primero": [
        "Fundamentos de la Administración",
        "Contabilidad para la Administración",
        "Fundamentos de la Producción Agropecuaria",
        "Instalaciones y Maquinarias Agropecuarias",
        "Fundamentos de Economía",
        "Producción Vegetal",
        "Tecnología, Innovación y Contexto Agro Productivo",
    ],
    "segundo": [
        "Administración de Costos",
        "Gestión de la Empresa Agropecuaria",
        "Modelización y Estructuras Matemáticas",
        "Inglés Técnico Aplicado al Agro",
        "Producción Animal",
        "Gestión de Recursos Humanos",
        "Cálculo Aplicado a la Gestión Agropecuaria",
        "Economía Empresarial",
        "Procesos Agroindustriales de Origen Vegetal",
    ],
    "tercero": [
        "Planificación de la Empresa Agropecuaria",
        "Procesos Agroindustriales de Origen Animal",
        "Matemática para la Toma de Decisiones Económicas",
        "Análisis de Datos y Probabilidad Aplicada",
        "Comercialización Agropecuaria y Mercados",
        "Derecho Agrario",
        "Inglés Técnico para Comunicación",
        "Optimización de Procesos Productivos",
        "Administración Financiera",
        "Gestión Ambiental",
        "Higiene y Seguridad Rural",
    ],
    "cuarto": [
        "Control de Gestión de la Empresa Agropecuaria",
        "Proyectos de Inversión y Desarrollo",
        "Estrategias de Comercialización",
        "Gestión de la Calidad Agropecuaria y Agroindustrial",
        "Políticas y Organización Territorial Rural",
        "Taller de Integración Profesional",
    ],
}


class Command(BaseCommand):
    help = "Carga materias, comisiones y horarios de las 5 carreras principales"

    def handle(self, *args, **options):
        self.stdout.write("═══ Seed Académico ═══")

        # ── 1. Limpiar TODOS los datos académicos ──
        self.stdout.write("Limpiando todos los datos académicos...")
        horarios_borrados = HorarioCursado.objects.all().delete()[0]
        comisiones_borradas = Comision.objects.all().delete()[0]
        planes_borrados = PlanMateria.objects.all().delete()[0]
        self.stdout.write(
            f"  Borrados: {horarios_borrados} horarios, "
            f"{comisiones_borradas} comisiones, {planes_borrados} planes"
        )

        # ── 2. Actualizar espacios del mapa ──
        self.stdout.write("Actualizando espacios del mapa...")

        # Reasignar totems a nuevos espacios antes de borrar
        from api.models import Totem
        espacios_nuevos_nombres = {n for n, _, _ in ESPACIOS_MAPA}
        # Mapeo de espacios viejos a nuevos para totems
        REASIGNACION_TOTEMS = {
            "Aula 3C": "Aula 2.1",
            "Laboratorio de Informatica": "CinApTIC",
            "Aula 2C": "Aula 2.2",
        }
        for totem in Totem.objects.select_related("espacio").all():
            nuevo_nombre = REASIGNACION_TOTEMS.get(totem.espacio.nombre)
            if nuevo_nombre:
                nuevo_espacio, _ = Espacio.objects.get_or_create(
                    nombre=nuevo_nombre,
                    defaults={"tipo": "aula", "piso": "segundo_piso"},
                )
                totem.espacio = nuevo_espacio
                totem.save(update_fields=["espacio"])

        # Borrar espacios viejos que no están en el mapa
        Espacio.objects.exclude(nombre__in=espacios_nuevos_nombres).delete()

        # Crear espacios del mapa que no existen
        aulas_mapa = {}
        for nombre, tipo, piso in ESPACIOS_MAPA:
            e, _ = Espacio.objects.get_or_create(
                nombre=nombre,
                defaults={"tipo": tipo, "piso": piso},
            )
            aulas_mapa[nombre] = e
        self.stdout.write(f"  Espacios: {Espacio.objects.count()} total")

        # Agrupar aulas por piso para asignación
        aulas_1p = [e for _, e in aulas_mapa.items() if e.piso == "primer_piso"]
        aulas_2p = [e for _, e in aulas_mapa.items() if e.piso == "segundo_piso"]
        aulas_todas = aulas_1p + aulas_2p

        # ── 3. Crear Helper ──
        def mat(nombre):
            materia, _ = Materia.objects.get_or_create(nombre=nombre)
            return materia

        def crear_plan(carrera, materia_nombre, nivel, modalidad, plan, comisiones_data):
            """Crea PlanMateria + Comisiones + Horarios"""
            m = mat(materia_nombre)
            pm = PlanMateria.objects.create(
                carrera=carrera,
                materia=m,
                nivel=nivel,
                modalidad=modalidad,
                cuatrimestre=None if modalidad == "anual" else "primero",
                plan_estudio=plan,
            )
            for com_nombre, horarios in comisiones_data:
                com = Comision.objects.create(plan_materia=pm, nombre=com_nombre)
                for dia, inicio, fin in horarios:
                    # Rotar aulas
                    espacio = random.choice(aulas_todas)
                    HorarioCursado.objects.create(
                        comision=com,
                        espacio=espacio,
                        dia_semana=dia,
                        hora_inicio=inicio,
                        hora_fin=fin,
                        activo=True,
                    )
            return pm

        def generar_horarios_k1_k2():
            """Genera horarios para K1 (mañana) y K2 (tarde)"""
            dias1 = random.choice([("lunes",), ("martes",)])
            dias2 = random.choice([("miercoles",), ("jueves",)])
            if dias1 == dias2:
                dias2 = ("viernes",)

            k1 = []
            k2 = []
            # K1: mañana, 2 slots
            for dia in [dias1[0], dias2[0]]:
                k1.append((dia, FRANJAS_MANANA[0][0], FRANJAS_MANANA[0][1]))
                k1.append((dia, FRANJAS_MANANA[1][0], FRANJAS_MANANA[1][1]))
            # K2: tarde, 2 slots
            for dia in [dias1[0], dias2[0]]:
                k2.append((dia, FRANJAS_TARDE[0][0], FRANJAS_TARDE[0][1]))
                k2.append((dia, FRANJAS_TARDE[1][0], FRANJAS_TARDE[1][1]))
            return [("K1", k1), ("K2", k2)]

        def generar_horarios_unica():
            """Genera horarios para comisión Única"""
            combo = random.choice(DIAS_COMBINACIONES)
            dias = combo[0]
            franjas = random.choice([FRANJAS_MANANA, FRANJAS_TARDE, FRANJAS_NOCHE])
            horarios = []
            for dia in dias:
                horarios.append((dia, franjas[0][0], franjas[0][1]))
                horarios.append((dia, franjas[1][0], franjas[1][1]))
            return [("Única", horarios)]

        # ── 4. ISI (Plan 2023, 5 años, anual) ──
        self.stdout.write("Cargando ISI...")
        c_isi = Carrera.objects.get(codigo="ISI")
        for nivel, materias_lista in MATERIAS_ISI.items():
            for materia_nombre in materias_lista:
                if nivel in ("primero", "segundo"):
                    comisiones = generar_horarios_k1_k2()
                else:
                    comisiones = generar_horarios_unica()
                crear_plan(c_isi, materia_nombre, nivel, "anual", "2023", comisiones)

        # ── 5. IQ (Plan 2023, 5 años, anual) ──
        self.stdout.write("Cargando IQ...")
        c_iq = Carrera.objects.get(codigo="IQ")
        for nivel, materias_lista in MATERIAS_IQ.items():
            for materia_nombre in materias_lista:
                if nivel in ("primero", "segundo"):
                    comisiones = generar_horarios_k1_k2()
                else:
                    comisiones = generar_horarios_unica()
                crear_plan(c_iq, materia_nombre, nivel, "anual", "2023", comisiones)

        # ── 6. IEM (Plan 2023, 5 años, anual) ──
        self.stdout.write("Cargando IEM...")
        c_iem = Carrera.objects.get(codigo="IEM")
        for nivel, materias_lista in MATERIAS_IEM.items():
            for materia_nombre in materias_lista:
                if nivel in ("primero", "segundo"):
                    comisiones = generar_horarios_k1_k2()
                else:
                    comisiones = generar_horarios_unica()
                crear_plan(c_iem, materia_nombre, nivel, "anual", "2023", comisiones)

        # ── 7. TUP (Plan 2024, 2 años, cuatrimestral) ──
        self.stdout.write("Cargando TUP...")
        c_tup = Carrera.objects.get(codigo="TUP")
        for cuatrimestre, materias_lista in MATERIAS_TUP.items():
            for materia_nombre in materias_lista:
                comisiones = generar_horarios_k1_k2()
                pm = crear_plan(c_tup, materia_nombre, cuatrimestre, "cuatrimestral", "2023", comisiones)
                # Asignar cuatrimestre correcto
                if cuatrimestre == "primero":
                    pm.cuatrimestre = "primero"
                elif cuatrimestre == "segundo":
                    pm.cuatrimestre = "segundo"
                elif cuatrimestre == "tercero":
                    pm.cuatrimestre = "primero"
                elif cuatrimestre == "cuarto":
                    pm.cuatrimestre = "segundo"
                pm.save(update_fields=["cuatrimestre"])

        # ── 8. LAR (Plan 2026, 4 años, anual) ──
        self.stdout.write("Cargando LAR...")
        c_lar = Carrera.objects.get(codigo="LAR")
        for nivel, materias_lista in MATERIAS_LAR.items():
            for materia_nombre in materias_lista:
                if nivel in ("primero", "segundo"):
                    comisiones = generar_horarios_k1_k2()
                else:
                    comisiones = generar_horarios_unica()
                crear_plan(c_lar, materia_nombre, nivel, "anual", "2023", comisiones)

        # ── Resumen ──
        carreras_ids = [c_isi.id, c_iq.id, c_iem.id, c_tup.id, c_lar.id]
        total_horarios = HorarioCursado.objects.filter(
            comision__plan_materia__carrera_id__in=carreras_ids
        ).count()
        total_comisiones = Comision.objects.filter(
            plan_materia__carrera_id__in=carreras_ids
        ).count()
        total_planes = PlanMateria.objects.filter(
            carrera_id__in=carreras_ids
        ).count()
        total_materias = Materia.objects.filter(
            carreras__carrera_id__in=carreras_ids
        ).distinct().count()

        self.stdout.write(self.style.SUCCESS(
            f"\n═══ Completado ═══\n"
            f"  Carreras: 5\n"
            f"  Materias: {total_materias}\n"
            f"  PlanMaterias: {total_planes}\n"
            f"  Comisiones: {total_comisiones}\n"
            f"  Horarios: {total_horarios}\n"
            f"  Espacios: {Espacio.objects.count()}"
        ))
