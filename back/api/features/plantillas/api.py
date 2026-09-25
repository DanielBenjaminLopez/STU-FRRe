"""HTTP entry points for template composition."""

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models.configuracion import Plantilla, PlantillaWidget
from ...permissions import IsAdminOrSecretaria
from ...realtime import notify_totems
from ...serializers import (
    PlantillaSerializer,
    PlantillaWidgetPosicionSerializer,
    PlantillaWidgetSerializer,
    validar_solapamiento_payload,
)


class PlantillaViewSet(viewsets.ModelViewSet):
    queryset = Plantilla.objects.prefetch_related('widgets_posiciones__widget').all()
    serializer_class = PlantillaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def _notify_assigned_totems(self, plantilla):
        notify_totems(plantilla.totems.values_list('id', flat=True))

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.totems.exists():
            return Response(
                {
                    "detail": (
                        f"No se puede eliminar la plantilla '{instance.nombre}' "
                        "porque está asignada a uno o más tótems. "
                        "Desasígnala de los tótems antes de eliminarla."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='reemplazar-widgets')
    def reemplazar_widgets(self, request, pk=None):
        plantilla = self.get_object()
        items = request.data
        if not isinstance(items, list):
            return Response(
                {"detail": "Se esperaba una lista de widgets."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        posiciones = []
        for item in items:
            serializer = PlantillaWidgetPosicionSerializer(data=item)
            serializer.is_valid(raise_exception=True)
            posiciones.append(serializer.validated_data)

        validar_solapamiento_payload(posiciones)
        with transaction.atomic():
            plantilla.widgets_posiciones.all().delete()
            PlantillaWidget.objects.bulk_create(
                [PlantillaWidget(plantilla=plantilla, **datos) for datos in posiciones]
            )
            transaction.on_commit(lambda: self._notify_assigned_totems(plantilla))

        plantilla_actualizada = Plantilla.objects.prefetch_related(
            'widgets_posiciones__widget'
        ).get(pk=plantilla.pk)
        return Response(PlantillaSerializer(plantilla_actualizada).data)


class PlantillaWidgetViewSet(viewsets.ModelViewSet):
    queryset = PlantillaWidget.objects.select_related('plantilla', 'widget').all()
    serializer_class = PlantillaWidgetSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

__all__ = ["PlantillaViewSet", "PlantillaWidgetViewSet"]
