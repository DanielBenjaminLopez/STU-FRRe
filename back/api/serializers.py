from rest_framework import serializers

from .models import ActividadExtra, Carrera, CarreraMateria, HorarioCursado, MesaExamen, Materia, Noticias, Suspension


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


class ActividadExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActividadExtra
        fields = ['id', 'titulo', 'tipo', 'descripcion', 'fecha_hora_inicio', 'fecha_hora_fin', 'espacio']


class SuspensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suspension
        fields = ['id', 'horario_cursado', 'actividad_extra', 'fecha', 'motivo', 'tipo', 'creado_en']
        read_only_fields = ['creado_en']


class NoticiasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticias
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'fecha_expiracion', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
