"""
Vistas para carga de horarios desde PDF.

Endpoints:
- POST /api/upload-horarios/ — Sube PDF, procesa OCR, retorna task_id
- GET  /api/horarios/preview/<task_id>/ — Retorna JSON con datos extraídos
- POST /api/horarios/import/<task_id>/ — Importa datos confirmados a la BD
"""

import json
import logging
import os
import uuid
from pathlib import Path

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .pdf_parser import HorarioRow, ParseResult, parse_pdf
from .permissions import IsAdminOrSecretaria
from .services.import_horarios import import_horarios

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("/tmp/horarios_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Almacén en memoria de resultados parseados (key: task_id → dict serializable)
_preview_store: dict[str, dict] = {}


def _serialize_horario(h: HorarioRow) -> dict:
    """Serializa un HorarioRow a dict para JSON."""
    return {
        "anio": h.anio,
        "comision": h.comision,
        "materia": h.materia,
        "dia": h.dia,
        "hora_inicio": h.hora_inicio,
        "hora_fin": h.hora_fin,
        "aula": h.aula,
    }


def _serialize_result(result: ParseResult) -> dict:
    """Serializa un ParseResult a dict para JSON."""
    return {
        "carrera": result.carrera,
        "cuatrimestre": result.cuatrimestre,
        "anio_plan": result.anio_plan,
        "paginas_procesadas": result.paginas_procesadas,
        "total_horarios": len(result.horarios),
        "horarios": [_serialize_horario(h) for h in result.horarios],
        "errores": result.errores,
    }


class UploadHorarioView(APIView):
    """
    POST: Recibe un PDF de horarios, lo procesa con OCR, y retorna un task_id
    para consultar la vista previa.
    """

    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def post(self, request):
        pdf_file = request.FILES.get("archivo")
        if not pdf_file:
            return Response(
                {"detail": "No se proporcionó un archivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not pdf_file.name.lower().endswith(".pdf"):
            return Response(
                {"detail": "El archivo debe ser un PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pdf_file.size > 20 * 1024 * 1024:
            return Response(
                {"detail": "El archivo no puede superar 20 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pdf_bytes = pdf_file.read()
        except Exception as e:
            return Response(
                {"detail": f"Error al leer el archivo: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result: ParseResult = parse_pdf(pdf_bytes)
        except Exception as e:
            logger.exception("Error al procesar PDF")
            return Response(
                {"detail": f"Error al procesar el PDF: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        task_id = str(uuid.uuid4())
        _preview_store[task_id] = _serialize_result(result)

        return Response(
            {
                "task_id": task_id,
                "total_horarios": len(result.horarios),
                "paginas_procesadas": result.paginas_procesadas,
                "errores": result.errores,
            },
            status=status.HTTP_201_CREATED,
        )


class HorarioPreviewView(APIView):
    """
    GET: Retorna el JSON con los datos extraídos del PDF para revisión.
    """

    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def get(self, request, task_id):
        if task_id not in _preview_store:
            return Response(
                {"detail": "Sesión no encontrada o expirada. Suba el PDF nuevamente."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = _preview_store[task_id]
        return Response(data)


class HorarioImportView(APIView):
    """
    POST: Importa los datos confirmados a la base de datos.
    Acepta un body JSON opcional con overrides (carrera, cuatrimestre, etc.)
    y horarios editados.
    """

    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def post(self, request, task_id):
        if task_id not in _preview_store:
            return Response(
                {"detail": "Sesión no encontrada o expirada. Suba el PDF nuevamente."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = _preview_store[task_id]

        body = request.data if request.data else {}
        horarios_data = body.get("horarios", data.get("horarios", []))
        carrera = body.get("carrera", data.get("carrera", "Ingeniería en Sistemas de Información"))
        cuatrimestre = body.get("cuatrimestre", data.get("cuatrimestre", "2do"))
        anio_plan = body.get("anio_plan", data.get("anio_plan", 2026))

        horarios = []
        for h in horarios_data:
            try:
                horarios.append(
                    HorarioRow(
                        anio=h.get("anio", "primero"),
                        comision=h.get("comision", ""),
                        materia=h.get("materia", ""),
                        dia=h.get("dia", ""),
                        hora_inicio=h.get("hora_inicio", ""),
                        hora_fin=h.get("hora_fin", ""),
                        aula=h.get("aula"),
                    )
                )
            except Exception as e:
                logger.warning("Error al deserialize horario: %s", e)

        if not horarios:
            return Response(
                {"detail": "No hay horarios para importar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = import_horarios(
                horarios=horarios,
                carrera_nombre=carrera,
                cuatrimestre=cuatrimestre,
                anio_plan=anio_plan,
            )
        except Exception as e:
            logger.exception("Error durante la importación")
            return Response(
                {"detail": f"Error durante la importación: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        del _preview_store[task_id]

        return Response(
            {
                "detail": "Importación completada",
                "horarios_creados": result.horarios_creados,
                "materias_creadas": result.materias_creadas,
                "comisiones_creadas": result.comisiones_creadas,
                "espacios_creados": result.espacios_creados,
                "errores": result.errores or [],
            }
        )
