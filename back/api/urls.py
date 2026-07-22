from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    ActividadExtraViewSet,
    AvisosActivosView,
    CarreraMateriaViewSet,
    CarreraViewSet,
    EspacioListView,
    HorarioCursadoViewSet,
    MateriaViewSet,
    MeView,
    MesaExamenViewSet,
    NoticiasViewSet,
    SuspensionViewSet,
    TotemNewView,
    TotemViewSet,
    VincularTotemView,
)

router = DefaultRouter()
router.register('carreras', CarreraViewSet)
router.register('materias', MateriaViewSet)
router.register('carrerasmaterias', CarreraMateriaViewSet)
router.register('horarios', HorarioCursadoViewSet)
router.register('mesas-examen', MesaExamenViewSet)
router.register('eventos', ActividadExtraViewSet)
router.register('avisos', SuspensionViewSet)
router.register('noticias', NoticiasViewSet)
router.register('totems', TotemViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('totems/new/', TotemNewView.as_view(), name='totem_new'),
    path('totems/vincular/', VincularTotemView.as_view(), name='totem_vincular'),
    path('espacios/', EspacioListView.as_view(), name='espacios_list'),
    path('avisos-activos/', AvisosActivosView.as_view(), name='avisos_activos'),
]
