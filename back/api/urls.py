from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AvisoViewSet,
    PlanMateriaViewSet,
    CarreraViewSet,
    ComisionViewSet,
    EspacioListView,
    EventoViewSet,
    HorarioCursadoViewSet,
    MateriaViewSet,
    MeView,
    MesaExamenViewSet,
    NoticiasViewSet,
    TotemNewView,
    VincularTotemView,
)

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

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('totems/new/', TotemNewView.as_view(), name='totem_new'),
    path('totems/vincular/', VincularTotemView.as_view(), name='totem_vincular'),
    path('espacios/', EspacioListView.as_view(), name='espacios_list'),
]
