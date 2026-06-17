from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Carrera, CarreraMateria, HorarioCursado, Materia
from .serializers import (
    CarreraMateriaSerializer,
    CarreraSerializer,
    HorarioCursadoSerializer,
    MateriaSerializer,
)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'groups': list(request.user.groups.values_list('name', flat=True)),
        })


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
