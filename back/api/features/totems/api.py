"""HTTP entry points for totem lifecycle and configuration."""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ...authentication import TotemToken
from ...models.configuracion import Totem
from ...permissions import IsAdminOrSecretaria, IsTotem
from ...realtime import notify_totem, notify_totem_deleted, notify_totems
from ...serializers import TotemNuevoSerializer, TotemSerializer, VincularTotemSerializer
from ...throttling import TotemNewRateThrottle
from django.db import transaction
from rest_framework.permissions import IsAuthenticated


class TotemViewSet(viewsets.ModelViewSet):
    queryset = Totem.objects.all()
    serializer_class = TotemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def get_queryset(self):
        qs = Totem.objects.select_related('espacio', 'plantilla').prefetch_related(
            'plantilla__widgets_posiciones__widget'
        )
        vinculado = self.request.query_params.get('vinculado')
        if vinculado is not None:
            if vinculado.lower() in ('true', '1'):
                return qs.filter(vinculado=True)
            if vinculado.lower() in ('false', '0'):
                return qs.filter(vinculado=False)
            return qs.all()
        if self.action == 'list':
            return qs.filter(vinculado=True)
        return qs.all()

    def perform_update(self, serializer):
        totem = serializer.save()
        transaction.on_commit(lambda: notify_totems([totem.id]))

    def perform_destroy(self, instance):
        totem_id = instance.id
        instance.delete()
        transaction.on_commit(lambda: notify_totem_deleted(totem_id))


class TotemMeView(APIView):
    permission_classes = [IsTotem]

    def get(self, request):
        totem = Totem.objects.select_related('espacio', 'plantilla').prefetch_related(
            'plantilla__widgets_posiciones__widget'
        ).get(pk=request.user.totem.id)
        return Response(TotemSerializer(totem, context={'request': request}).data)


class TotemConfigVideoView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, pk):
        totem = get_object_or_404(Totem, pk=pk)
        data = TotemSerializer(totem, context={'request': request}).data
        return Response({
            'video_url': data.get('video_url'),
            'video_intervalo': totem.video_intervalo,
            'video_activo': totem.video_activo,
        })

    def patch(self, request, pk):
        totem = get_object_or_404(Totem, pk=pk)
        serializer = TotemSerializer(
            totem, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if 'video_activo' in request.data or 'video_intervalo' in request.data:
            transaction.on_commit(lambda: notify_totem(totem.id))
        return Response(serializer.data)

    def delete(self, request, pk):
        totem = get_object_or_404(Totem, pk=pk)
        totem.video_archivo = None
        totem.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TotemNewView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [TotemNewRateThrottle]

    def post(self, request):
        serializer = TotemNuevoSerializer(data={})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VincularTotemView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def post(self, request):
        serializer = VincularTotemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        totem = serializer.save()
        totem_token = TotemToken.for_totem(totem)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"totem_{serializer.validated_data['codigo_vinculacion']}",
            {'type': 'vinculado', 'totem_id': totem.id, 'access': str(totem_token)},
        )
        return Response(TotemSerializer(totem).data, status=status.HTTP_200_OK)

__all__ = [
    "TotemConfigVideoView",
    "TotemMeView",
    "TotemNewView",
    "TotemViewSet",
    "VincularTotemView",
]
