from rest_framework import serializers

from .models import Carrera, CarreraMateria, HorarioCursado, MesaExamen, Materia


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


class HorarioCursadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioCursado
        fields = [
            'id', 'materia', 'espacio', 'dia_semana', 'comision',
            'hora_inicio', 'hora_fin', 'fecha_inicio_vigencia',
            'fecha_fin_vigencia', 'activo',
        ]


class MesaExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = MesaExamen
        fields = ['id', 'materia', 'espacio', 'fecha_hora', 'turno', 'llamado', 'tribunal', 'activo']
