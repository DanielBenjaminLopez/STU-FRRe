from django.utils import timezone
from rest_framework import serializers

from .models import (
    ActividadExtra,
    Carrera,
    CarreraMateria,
    Espacio,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Suspension,
    Totem
)


class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        fields = ['id', 'codigo', 'nombre']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'codigo', 'nombre', 'profesores']


class CarreraMateriaSerializer(serializers.ModelSerializer):
    carrera_nombre = serializers.CharField(source='carrera.__str__', read_only=True)
    materia_nombre = serializers.CharField(source='materia.__str__', read_only=True)

    class Meta:
        model = CarreraMateria
        fields = ['id', 'carrera', 'materia', 'carrera_nombre', 'materia_nombre', 'anio_plan', 'cuatrimestre']


class HorarioCursadoSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.__str__', read_only=True)
    espacio_nombre = serializers.CharField(source='espacio.__str__', read_only=True)

    class Meta:
        model = HorarioCursado
        fields = [
            'id', 'materia', 'espacio', 'materia_nombre', 'espacio_nombre',
            'dia_semana', 'comision', 'hora_inicio', 'hora_fin',
            'fecha_inicio_vigencia', 'fecha_fin_vigencia', 'activo',
        ]


class MesaExamenSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.__str__', read_only=True)
    espacio_nombre = serializers.CharField(source='espacio.__str__', read_only=True)

    class Meta:
        model = MesaExamen
        fields = [
            'id', 'materia', 'espacio', 'materia_nombre', 'espacio_nombre',
            'fecha_hora', 'turno', 'llamado', 'tribunal', 'activo',
        ]


class ActividadExtraSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ActividadExtra
        fields = [
            'id', 'titulo', 'tipo', 'descripcion', 'fecha_hora_inicio',
            'fecha_hora_fin', 'espacio', 'espacio_nombre',
        ]

    def get_espacio_nombre(self, obj):
        return str(obj.espacio) if obj.espacio else None


class SuspensionSerializer(serializers.ModelSerializer):
    horario_cursado_str = serializers.SerializerMethodField()
    actividad_extra_str = serializers.SerializerMethodField()

    class Meta:
        model = Suspension
        fields = [
            'id', 'horario_cursado', 'actividad_extra',
            'horario_cursado_str', 'actividad_extra_str',
            'fecha', 'motivo', 'tipo', 'creado_en',
        ]
        read_only_fields = ['creado_en']

    def get_horario_cursado_str(self, obj):
        return str(obj.horario_cursado) if obj.horario_cursado else None

    def get_actividad_extra_str(self, obj):
        return str(obj.actividad_extra) if obj.actividad_extra else None


class NoticiasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticias
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'fecha_expiracion', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class EspacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Espacio
        fields = ['id', 'nombre', 'tipo', 'piso']


class TotemNuevoSerializer(serializers.Serializer):
    codigo_vinculacion = serializers.CharField(read_only=True)

    def create(self, validated_data):
        codigo = Totem.generar_codigo()
        totem = Totem.objects.create(
            codigo_vinculacion=codigo,
            codigo_creado_en=timezone.now(),
        )
        return totem

    def to_representation(self, instance):
        return {'codigo_vinculacion': instance.codigo_vinculacion}


class VincularTotemSerializer(serializers.Serializer):
    codigo_vinculacion = serializers.CharField(max_length=10)
    nombre = serializers.CharField(max_length=150)
    espacio_id = serializers.IntegerField()

    def validate_codigo_vinculacion(self, value):
        try:
            totem = Totem.objects.get(codigo_vinculacion=value)
        except Totem.DoesNotExist:
            raise serializers.ValidationError('Código de vinculación inválido.')

        if totem.vinculado:
            raise serializers.ValidationError('Este tótem ya fue vinculado.')

        if not totem.codigo_valido:
            raise serializers.ValidationError(
                'El código de vinculación ha expirado.'
            )

        self._totem = totem
        return value

    def validate_espacio_id(self, value):
        if not Espacio.objects.filter(id=value).exists():
            raise serializers.ValidationError('El espacio seleccionado no existe.')
        return value

    def create(self, validated_data):
        totem = self._totem
        totem.nombre = validated_data['nombre']
        totem.espacio_id = validated_data['espacio_id']
        totem.vinculado = True
        totem.codigo_vinculacion = None
        totem.codigo_creado_en = None
        totem.save()
        return totem


class TotemSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Totem
        fields = [
            'id', 'nombre', 'espacio_id', 'espacio_nombre', 'activo',
            'config_pantalla', 'vinculado', 'creado_en',
        ]

    def get_espacio_nombre(self, obj):
        return str(obj.espacio) if obj.espacio else None
