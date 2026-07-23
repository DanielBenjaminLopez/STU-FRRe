from django.utils import timezone
from rest_framework import serializers

from .models import (
    Aviso,
    Carrera,
    PlanMateria,
    Comision,
    Espacio,
    Evento,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Totem
)


class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        fields = ['id', 'nombre']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'nombre']


class PlanMateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanMateria
        fields = ['id', 'carrera', 'materia', 'nivel', 'modalidad', 'cuatrimestre', 'plan_estudio']


class ComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comision
        fields = ['id', 'plan_materia', 'nombre']


class HorarioCursadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioCursado
        fields = [
            'id', 'comision', 'espacio', 'dia_semana',
            'hora_inicio', 'hora_fin', 'activo',
        ]


class MesaExamenSerializer(serializers.ModelSerializer):
    llamado = serializers.IntegerField(read_only=True)
    dia_semana = serializers.CharField(read_only=True)

    class Meta:
        model = MesaExamen
        fields = ['id', 'plan_materia', 'espacio', 'fecha', 'hora', 'turno', 'llamado', 'dia_semana', 'activo']


class EventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'tipo', 'tipo_otro', 'descripcion', 'fecha_hora_inicio', 'fecha_hora_fin', 'espacio']


class AvisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aviso
        fields = ['id', 'horario_cursado', 'evento', 'fecha', 'motivo', 'tipo', 'tipo_otro', 'creado_en']
        read_only_fields = ['creado_en']


class NoticiasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticias
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'fecha_expiracion']


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
    class Meta:
        model = Totem
        fields = [
            'id', 'nombre', 'espacio_id',
            'config_pantalla', 'vinculado', 'creado_en',
        ]