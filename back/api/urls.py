from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import CarreraViewSet, CarreraMateriaViewSet, MateriaViewSet, MeView

router = DefaultRouter()
router.register('carreras', CarreraViewSet)
router.register('materias', MateriaViewSet)
router.register('carrerasmaterias', CarreraMateriaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
]
