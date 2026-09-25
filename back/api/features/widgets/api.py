"""HTTP entry points for the widget catalog feature."""

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models.configuracion import Widget
from ...permissions import IsAdminOrSecretaria
from ...serializers import WidgetSerializer


class WidgetViewSet(viewsets.ModelViewSet):
    queryset = Widget.objects.all()
    serializer_class = WidgetSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.plantillas_posiciones.exists():
            return Response(
                {
                    "detail": (
                        f"No se puede eliminar el widget '{instance.nombre}' "
                        "porque está siendo utilizado en una o más plantillas. "
                        "Desactívelo en su lugar."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

__all__ = ["WidgetViewSet"]
