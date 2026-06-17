from rest_framework import serializers

from .models import Carrera, CarreraMateria, Materia


class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        fields = ['id', 'codigo', 'nombre']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'codigo', 'nombre', 'profesores']


class CarreraMateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarreraMateria
        fields = ['id', 'carrera', 'materia', 'anio_plan', 'cuatrimestre']
