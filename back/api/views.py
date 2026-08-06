from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import TotemToken
from .models import (
    Aviso,
    Carrera,
    EventoCalendario,
    PlanMateria,
    Comision,
    Espacio,
    Evento,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Plantilla,
    PlantillaWidget,
    Totem,
    Widget,
)
from .permissions import IsAdminOrSecretaria, IsTotem
from .serializers import (
    AvisoSerializer,
    EventoCalendarioSerializer,
    PlanMateriaSerializer,
    CarreraSerializer,
    ComisionSerializer,
    EspacioSerializer,
    EventoSerializer,
    HorarioCursadoSerializer,
    MateriaSerializer,
    MesaExamenSerializer,
    NoticiasSerializer,
    PlantillaSerializer,
    PlantillaWidgetPosicionSerializer,
    PlantillaWidgetSerializer,
    TotemNuevoSerializer,
    TotemSerializer,
    VincularTotemSerializer,
    WidgetSerializer,
    validar_solapamiento_payload,
)


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



class PlantillaViewSet(viewsets.ModelViewSet):
    queryset = Plantilla.objects.prefetch_related('widgets_posiciones__widget').all()
    serializer_class = PlantillaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

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
                [
                    PlantillaWidget(plantilla=plantilla, **datos)
                    for datos in posiciones
                ]
            )

        plantilla_actualizada = Plantilla.objects.prefetch_related(
            'widgets_posiciones__widget'
        ).get(pk=plantilla.pk)
        return Response(PlantillaSerializer(plantilla_actualizada).data)


class PlantillaWidgetViewSet(viewsets.ModelViewSet):
    queryset = PlantillaWidget.objects.select_related('plantilla', 'widget').all()
    serializer_class = PlantillaWidgetSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]




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


class PlanMateriaViewSet(viewsets.ModelViewSet):
    queryset = PlanMateria.objects.select_related('carrera', 'materia').all()
    serializer_class = PlanMateriaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        carrera = self.request.query_params.get('carrera')
        nivel = self.request.query_params.get('nivel')
        modalidad = self.request.query_params.get('modalidad')
        if tipo:
            qs = qs.filter(carrera__tipo=tipo)
        if carrera:
            qs = qs.filter(carrera_id=carrera)
        if nivel:
            qs = qs.filter(nivel=nivel)
        if modalidad:
            qs = qs.filter(modalidad=modalidad)
        return qs


class ComisionViewSet(viewsets.ModelViewSet):
    queryset = Comision.objects.select_related(
        'plan_materia__carrera', 'plan_materia__materia'
    ).all()
    serializer_class = ComisionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        plan_materia = self.request.query_params.get('plan_materia')
        if plan_materia:
            qs = qs.filter(plan_materia_id=plan_materia)
        return qs


class HorarioCursadoViewSet(viewsets.ModelViewSet):
    queryset = HorarioCursado.objects.select_related(
        'comision__plan_materia__materia',
        'comision__plan_materia__carrera',
        'espacio',
    ).all()
    serializer_class = HorarioCursadoSerializer
    permission_classes = [AllowAny]


class MesaExamenViewSet(viewsets.ModelViewSet):
    queryset = MesaExamen.objects.select_related(
        'plan_materia__materia',
        'plan_materia__carrera',
        'espacio',
    ).all()
    serializer_class = MesaExamenSerializer


class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.select_related('espacio').all()
    serializer_class = EventoSerializer


class AvisoViewSet(viewsets.ModelViewSet):
    queryset = Aviso.objects.select_related('horario_cursado', 'evento').all()
    serializer_class = AvisoSerializer


class NoticiasViewSet(viewsets.ModelViewSet):
    queryset = Noticias.objects.all()
    serializer_class = NoticiasSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return Noticias.objects.all()
        now = timezone.now()
        return Noticias.objects.filter(
            Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gte=now)
        )

    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        now = timezone.now()
        noticia = Noticias.objects.filter(
            Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gte=now)
        ).order_by('-fecha_publicacion').first()
        if not noticia:
            return Response(None)
        return Response(NoticiasSerializer(noticia).data)

    @action(detail=False, methods=['post'], url_path='sync')
    def sync(self, request):
        from api.management.commands.scrape_noticias import scrape_noticias as do_scrape

        try:
            noticias_scrapeadas = do_scrape()
        except Exception as e:
            return Response(
                {'detail': f'Error al scrapeear: {e}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        nuevas = 0
        actualizadas = 0
        for n in noticias_scrapeadas:
            obj, created = Noticias.objects.update_or_create(
                enlace=n['enlace'],
                defaults={
                    'titulo': n['titulo'],
                    'contenido': n['contenido'],
                    'fecha_publicacion': n['fecha_publicacion'],
                    'fecha_expiracion': n['fecha_expiracion'],
                    'imagen_url': n['imagen_url'],
                    'origen': 'scraping',
                },
            )
            if created:
                nuevas += 1
            else:
                actualizadas += 1

        return Response({
            'detail': f'Sincronización completa: {nuevas} nuevas, {actualizadas} actualizadas',
            'nuevas': nuevas,
            'actualizadas': actualizadas,
            'total': len(noticias_scrapeadas),
        })


class AvisosActivosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.now().date()
        avisos = Suspension.objects.filter(fecha__gte=hoy).order_by('-fecha')[:5]
        serializer = SuspensionSerializer(avisos, many=True)
        return Response(serializer.data)


class TotemViewSet(viewsets.ModelViewSet):
    queryset = Totem.objects.select_related('espacio', 'plantilla').prefetch_related(
        'plantilla__widgets_posiciones__widget'
    ).all()
    serializer_class = TotemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]


class TotemMeView(APIView):
    permission_classes = [IsTotem]

    def get(self, request):
        totem = Totem.objects.select_related(
            'espacio', 'plantilla'
        ).prefetch_related(
            'plantilla__widgets_posiciones__widget'
        ).get(pk=request.user.totem.id)
        return Response(TotemSerializer(totem).data)


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


class EventoCalendarioViewSet(viewsets.ModelViewSet):
    queryset = EventoCalendario.objects.all()
    serializer_class = EventoCalendarioSerializer
    permission_classes = [AllowAny]


class BulkCalendarView(APIView):
    """Reemplaza todos los eventos de un año con una lista nueva."""
    permission_classes = [IsAuthenticated, IsAdminOrSecretaria]

    def post(self, request):
        eventos = request.data.get('eventos', [])
        year = request.data.get('year')

        if not eventos:
            return Response(
                {'detail': 'No se proporcionaron eventos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                if year:
                    EventoCalendario.objects.filter(
                        fecha_inicio__year=year
                    ).delete()
                else:
                    EventoCalendario.objects.all().delete()

                created = []
                for e in eventos:
                    evento = EventoCalendario.objects.create(
                        titulo=e.get('titulo', ''),
                        tipo=e.get('tipo', 'otro'),
                        fecha_inicio=e.get('fecha_inicio'),
                        fecha_fin=e.get('fecha_fin') or None,
                        todo_el_dia=e.get('todo_el_dia', True),
                        color=e.get('color', ''),
                        descripcion=e.get('descripcion', ''),
                    )
                    created.append(evento.id)

            return Response({
                'guardados': len(created),
                'ids': created,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'detail': f'Error al guardar eventos: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
