"""
Servicio de importación de horarios extraídos de PDF a la BD.

NOTA: Esta importación es una primera aproximación. Los nombres de materias
y aulas extraídos por OCR pueden no ser 100% precisos respecto a los
registros existentes en la BD. Se recomienda revisión manual en la
vista previa antes de confirmar la importación.

MEJORAS FUTURAS:
- [ ] Fuzzy matching de nombres de materias (ej: "Prob.y Estad" vs "Probabilidad y Estadística")
- [ ] Validación de que las aulas detectadas pertenezcan a espacios del mapa
- [ ] Control de tipado y normalización estricta de nombres
"""

import logging
from dataclasses import dataclass

from django.db import transaction

from api.models import Carrera, Comision, Espacio, HorarioCursado, Materia, PlanMateria
from api.pdf_parser import HorarioRow

logger = logging.getLogger(__name__)

YEAR_TO_NIVEL = {
    "primero": "primero",
    "segundo": "segundo",
    "tercero": "tercero",
    "cuarto": "cuarto",
    "quinto": "quinto",
}


@dataclass
class ImportResult:
    """Resultado de la importación."""

    horarios_creados: int = 0
    materias_creadas: int = 0
    comisiones_creadas: int = 0
    espacios_creados: int = 0
    errores: list[str] | None = None

    def __post_init__(self):
        if self.errores is None:
            self.errores = []


def _normalize_materia_name(nombre: str) -> str:
    """Normaliza el nombre de una materia para búsqueda."""
    nombre = nombre.strip()
    nombre = nombre.replace("  ", " ")

    abbreviations = {
        "Prob.y Estad": "Probabilidad y Estadística",
        "Prob. y Estad": "Probabilidad y Estadística",
        "A Matemático I": "Análisis Matemático I",
        "A Matemático II": "Análisis Matemático II",
        "A Matemático III": "Análisis Matemático III",
        "Análisis Num": "Análisis Numérico",
        "Sist.Operativos": "Sistemas Operativos",
        "An.de Sistemas": "Análisis de Sistemas",
        "Práct.Sup": "Práctica Supervisada",
        "Fundam.de Ciberseguridad": "Fundamentos de Ciberseguridad",
        "Asp.Avanzados de Redes de Inf": "Aspectos Avanzados de Redes de Información",
    }

    for abbrev, full in abbreviations.items():
        if nombre.lower().startswith(abbrev.lower()):
            return full

    return nombre


def _normalize_comision_name(nombre: str) -> str:
    """Normaliza el nombre de una comisión."""
    nombre = nombre.strip()
    if nombre.lower().startswith("curso"):
        match_str = nombre.lower().replace("curso", "").strip()
        if match_str.isdigit():
            return f"Curso {match_str}"
    return nombre


def import_horarios(
    horarios: list[HorarioRow],
    carrera_nombre: str = "Ingeniería en Sistemas de Información",
    cuatrimestre: str = "2do",
    anio_plan: int = 2026,
) -> ImportResult:
    """
    Importa horarios extraídos del PDF a la base de datos.

    La importación se realiza en una transacción atómica: si falla
    algo, se revierte todo.

    TODO (mejora futura): Implementar fuzzy matching para nombres de materias
    que pueden estar abreviados en el PDF (ej: "Prob.y Estad" → "Probabilidad
    y Estadística"). Actualmente se busca por nombre exacto.

    TODO (mejora futura): Validar que las aulas detectadas sean espacios
    que existan en el mapa del sistema. Actualmente se crean como tipo "aula"
    genérico.

    Args:
        horarios: Lista de HorarioRow extraídos del parser.
        carrera_nombre: Nombre de la carrera.
        cuatrimestre: Cuatrimestre (ej: "2do").
        anio_plan: Año del plan de estudio.

    Returns:
        ImportResult con estadísticas de la importación.
    """
    result = ImportResult()

    with transaction.atomic():
        carrera, _ = Carrera.objects.get_or_create(
            nombre=carrera_nombre,
        )

        materia_cache: dict[str, Materia] = {}
        plan_materia_cache: dict[str, PlanMateria] = {}
        comision_cache: dict[str, Comision] = {}
        espacio_cache: dict[str, Espacio] = {}

        unique_materias = set()
        unique_comisiones = set()
        unique_espacios = set()

        for h in horarios:
            normalized = _normalize_materia_name(h.materia)
            if normalized:
                unique_materias.add(normalized)
            comision_name = _normalize_comision_name(h.comision) if h.comision else ""
            if comision_name:
                unique_comisiones.add(comision_name)
            if h.aula:
                unique_espacios.add(h.aula)

        for materia_nombre in unique_materias:
            if not materia_nombre:
                continue
            materia, created = Materia.objects.get_or_create(
                nombre=materia_nombre,
            )
            if created:
                result.materias_creadas += 1
            materia_cache[materia_nombre] = materia

        for h in horarios:
            normalized = _normalize_materia_name(h.materia)
            if not normalized or normalized not in materia_cache:
                if normalized:
                    result.errores.append(
                        f"Materia no encontrada en cache: '{normalized}'"
                    )
                continue

            materia = materia_cache[normalized]

            nivel = YEAR_TO_NIVEL.get(h.anio, "primero")

            pm_key = f"{materia.id}_{nivel}_{anio_plan}"
            if pm_key not in plan_materia_cache:
                plan_materia, _ = PlanMateria.objects.get_or_create(
                    carrera=carrera,
                    materia=materia,
                    nivel=nivel,
                    plan_estudio=str(anio_plan),
                    defaults={
                        "modalidad": "cuatrimestral",
                        "cuatrimestre": cuatrimestre,
                    },
                )
                plan_materia_cache[pm_key] = plan_materia

            plan_materia = plan_materia_cache[pm_key]

            comision_name = _normalize_comision_name(h.comision) if h.comision else ""
            comision_key = f"{plan_materia.id}_{comision_name}"
            if comision_key not in comision_cache:
                if comision_name:
                    comision, created = Comision.objects.get_or_create(
                        plan_materia=plan_materia,
                        nombre=comision_name,
                    )
                    if created:
                        result.comisiones_creadas += 1
                    comision_cache[comision_key] = comision
                else:
                    comision_cache[comision_key] = None

            comision = comision_cache[comision_key]

            espacio = None
            if h.aula:
                if h.aula not in espacio_cache:
                    # TODO: validar que la aula exista en el mapa del sistema
                    espacio_obj, created = Espacio.objects.get_or_create(
                        nombre=h.aula,
                        defaults={
                            "tipo": "aula",
                            "piso": "planta_baja",
                        },
                    )
                    if created:
                        result.espacios_creados += 1
                    espacio_cache[h.aula] = espacio_obj
                espacio = espacio_cache[h.aula]

            try:
                HorarioCursado.objects.create(
                    comision=comision,
                    espacio=espacio,
                    dia_semana=h.dia,
                    hora_inicio=h.hora_inicio,
                    hora_fin=h.hora_fin,
                    activo=True,
                )
                result.horarios_creados += 1
            except Exception as e:
                result.errores.append(
                    f"Error al crear horario {h.materia} ({h.dia} {h.hora_inicio}-{h.hora_fin}): {e}"
                )

    logger.info(
        "Importación completada: %d horarios, %d materias nuevas, "
        "%d comisiones nuevas, %d espacios nuevos, %d errores",
        result.horarios_creados,
        result.materias_creadas,
        result.comisiones_creadas,
        result.espacios_creados,
        len(result.errores) if result.errores else 0,
    )

    return result
