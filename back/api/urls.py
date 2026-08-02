from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AvisoViewSet,
    PlanMateriaViewSet,
    AvisosActivosView,
    CarreraViewSet,
    ComisionViewSet,
    EspacioListView,
    EventoViewSet,
    HorarioCursadoViewSet,
    MateriaViewSet,
    MeView,
    MesaExamenViewSet,
    NoticiasViewSet,
    PlantillaViewSet,
    PlantillaWidgetViewSet,
    TotemNewView,
    TotemMeView,
    TotemViewSet,
    VincularTotemView,
    WidgetViewSet,
)
from .views_pdf import HorarioImportView, HorarioPreviewView, UploadHorarioView

router = DefaultRouter()
router.register('carreras', CarreraViewSet)
router.register('materias', MateriaViewSet)
router.register('plan-materias', PlanMateriaViewSet)
router.register('comisiones', ComisionViewSet)
router.register('horarios', HorarioCursadoViewSet)
router.register('mesas-examen', MesaExamenViewSet)
router.register('eventos', EventoViewSet)
router.register('avisos', AvisoViewSet)
router.register('noticias', NoticiasViewSet)
router.register('totems', TotemViewSet)
router.register('widgets', WidgetViewSet)
router.register('plantillas', PlantillaViewSet)
router.register('plantilla-widgets', PlantillaWidgetViewSet)


urlpatterns = [
    path('totems/me/', TotemMeView.as_view(), name='totem_me'),
    path('totems/new/', TotemNewView.as_view(), name='totem_new'),
    path('totems/vincular/', VincularTotemView.as_view(), name='totem_vincular'),
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('espacios/', EspacioListView.as_view(), name='espacios_list'),
    path('avisos-activos/', AvisosActivosView.as_view(), name='avisos_activos'),
    path('upload-horarios/', UploadHorarioView.as_view(), name='upload_horarios'),
    path('horarios/preview/<str:task_id>/', HorarioPreviewView.as_view(), name='horario_preview'),
    path('horarios/import/<str:task_id>/', HorarioImportView.as_view(), name='horario_import'),
]
