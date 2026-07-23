from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import TotemToken
from .models import (
    ActividadExtra,
    Carrera,
    CarreraMateria,
    Espacio,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Suspension,
    Totem,
)
from .permissions import IsAdminOrSecretaria
from .serializers import (
    ActividadExtraSerializer,
    CarreraMateriaSerializer,
    CarreraSerializer,
    EspacioSerializer,
    HorarioCursadoSerializer,
    MateriaSerializer,
    MesaExamenSerializer,
    NoticiasSerializer,
    SuspensionSerializer,
    TotemNuevoSerializer,
    TotemSerializer,
    VincularTotemSerializer,
)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "groups": list(request.user.groups.values_list("name", flat=True)),
            }
        )


class CarreraViewSet(viewsets.ModelViewSet):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer


class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer


class CarreraMateriaViewSet(viewsets.ModelViewSet):
    queryset = CarreraMateria.objects.select_related('carrera', 'materia').all()
    serializer_class = CarreraMateriaSerializer


class HorarioCursadoViewSet(viewsets.ModelViewSet):
    queryset = HorarioCursado.objects.select_related('materia', 'espacio').all()
    serializer_class = HorarioCursadoSerializer


class MesaExamenViewSet(viewsets.ModelViewSet):
    queryset = MesaExamen.objects.select_related('materia', 'espacio').all()
    serializer_class = MesaExamenSerializer


class ActividadExtraViewSet(viewsets.ModelViewSet):
    queryset = ActividadExtra.objects.select_related('espacio').all()
    serializer_class = ActividadExtraSerializer


class SuspensionViewSet(viewsets.ModelViewSet):
    queryset = Suspension.objects.select_related('horario_cursado', 'actividad_extra').all()
    serializer_class = SuspensionSerializer


class NoticiasViewSet(viewsets.ModelViewSet):
    queryset = Noticias.objects.all()
    serializer_class = NoticiasSerializer

    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        noticia = Noticias.objects.order_by('-fecha_publicacion').first()
        if not noticia:
            return Response(None)
        return Response(NoticiasSerializer(noticia).data)


class AvisosActivosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.now().date()
        avisos = Suspension.objects.filter(fecha__gte=hoy).order_by('-fecha')[:5]
        serializer = SuspensionSerializer(avisos, many=True)
        return Response(serializer.data)


class TotemViewSet(viewsets.ModelViewSet):
    queryset = Totem.objects.select_related('espacio').all()
    serializer_class = TotemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]


class TotemNewView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TotemNuevoSerializer(data={})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


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
            {
                "type": "vinculado",
                "totem_id": totem.id,
                "access": str(totem_token),
            },
        )

        return Response(
            TotemSerializer(totem).data,
            status=status.HTTP_200_OK,
        )


class EspacioListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        espacios = Espacio.objects.all().order_by("piso", "nombre")
        serializer = EspacioSerializer(espacios, many=True)
        return Response(serializer.data)
