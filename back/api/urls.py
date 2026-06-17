from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ActividadExtraViewSet, CarreraViewSet, CarreraMateriaViewSet, HorarioCursadoViewSet, MesaExamenViewSet, MateriaViewSet, MeView, NoticiasViewSet, SuspensionViewSet

router = DefaultRouter()
router.register('carreras', CarreraViewSet)
router.register('materias', MateriaViewSet)
router.register('carrerasmaterias', CarreraMateriaViewSet)
router.register('horarios', HorarioCursadoViewSet)
router.register('mesas-examen', MesaExamenViewSet)
router.register('eventos', ActividadExtraViewSet)
router.register('avisos', SuspensionViewSet)
router.register('noticias', NoticiasViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
]
