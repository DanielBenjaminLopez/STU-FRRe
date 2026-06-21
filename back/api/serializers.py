from django.utils import timezone
from rest_framework import serializers

from .models import Espacio, Totem


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
            'id', 'nombre', 'espacio_id', 'activo',
            'config_pantalla', 'vinculado', 'creado_en',
        ]
