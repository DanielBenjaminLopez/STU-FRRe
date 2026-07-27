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
    Plantilla,
    PlantillaWidget,
    Totem,
    Widget,
)


class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Widget
        fields = [
            'id',
            'nombre',
            'tipo',
            'col_tam_default',
            'fila_tam_default',
            'activo',
            'creado_en',
        ]

    def validate_tipo(self, value):
        tipo_normalizado = value.strip().lower()
        if not tipo_normalizado.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError("El tipo solo debe contener letras, números, guiones o guiones bajos.")
        return tipo_normalizado

    def validate_col_tam_default(self, value):
        if value < 1 or value > 4:
            raise serializers.ValidationError("El ancho por defecto debe estar entre 1 y 4 columnas.")
        return value

    def validate_fila_tam_default(self, value):
        if value < 1:
            raise serializers.ValidationError("El alto por defecto debe ser de al menos 1 fila.")
        return value



GRID_COLS = 4


class PlantillaWidgetSerializer(serializers.ModelSerializer):
    widget_nombre = serializers.CharField(source='widget.nombre', read_only=True)
    widget_tipo = serializers.CharField(source='widget.tipo', read_only=True)

    class Meta:
        model = PlantillaWidget
        fields = [
            'id',
            'plantilla',
            'widget',
            'widget_nombre',
            'widget_tipo',
            'col_pos',
            'fila_pos',
            'col_tam',
            'fila_tam',
        ]

    def validate(self, data):
        col_pos = data.get('col_pos', getattr(self.instance, 'col_pos', 0))
        fila_pos = data.get('fila_pos', getattr(self.instance, 'fila_pos', 0))
        col_tam = data.get('col_tam', getattr(self.instance, 'col_tam', 1))
        fila_tam = data.get('fila_tam', getattr(self.instance, 'fila_tam', 1))
        plantilla = data.get('plantilla', getattr(self.instance, 'plantilla', None))

        if col_tam < 1:
            raise serializers.ValidationError({"col_tam": "El ancho del widget debe ser de al menos 1 columna."})
        if fila_tam < 1:
            raise serializers.ValidationError({"fila_tam": "El alto del widget debe ser de al menos 1 fila."})

        if col_pos < 0 or col_pos >= GRID_COLS:
            raise serializers.ValidationError({"col_pos": f"La posición de la columna debe estar entre 0 y {GRID_COLS - 1}."})

        if col_pos + col_tam > GRID_COLS:
            raise serializers.ValidationError(
                {"col_tam": f"El widget sobrepasa el límite de {GRID_COLS} columnas de la grilla (col_pos: {col_pos} + col_tam: {col_tam})."}
            )

        if plantilla:
            existentes = PlantillaWidget.objects.filter(plantilla=plantilla)
            if self.instance and self.instance.pk:
                existentes = existentes.exclude(pk=self.instance.pk)

            for w in existentes:
                colide_x = col_pos < (w.col_pos + w.col_tam) and (col_pos + col_tam) > w.col_pos
                colide_y = fila_pos < (w.fila_pos + w.fila_tam) and (fila_pos + fila_tam) > w.fila_pos
                if colide_x and colide_y:
                    raise serializers.ValidationError(
                        f"El widget se superpone con el widget '{w.widget.nombre}' en la posición ({w.col_pos}, {w.fila_pos})."
                    )

        return data



class PlantillaSerializer(serializers.ModelSerializer):
    widgets_posiciones = PlantillaWidgetSerializer(many=True, read_only=True)

    class Meta:
        model = Plantilla
        fields = [
            'id',
            'nombre',
            'activa',
            'widgets_posiciones',
            'creado_en',
        ]


class CarreraSerializer(serializers.ModelSerializer):

    class Meta:
        model = Carrera
        fields = ['id', 'nombre']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'nombre']

        
class PlanMateriaSerializer(serializers.ModelSerializer):
    carrera_nombre = serializers.CharField(source='carrera.__str__', read_only=True)
    materia_nombre = serializers.CharField(source='materia.__str__', read_only=True)
    
    class Meta:
        model = PlanMateria
        fields = ['id', 'carrera', 'materia', 'carrera_nombre', 'materia_nombre', 'nivel', 'modalidad', 'cuatrimestre', 'plan_estudio']


class ComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comision
        fields = ['id', 'plan_materia', 'nombre']

        
class HorarioCursadoSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='comision.plan_materia.materia.__str__', read_only=True)
    espacio_nombre = serializers.CharField(source='espacio.__str__', read_only=True)

    class Meta:
        model = HorarioCursado
        fields = [
            'id', 'comision', 'espacio', 'materia_nombre', 'espacio_nombre', 'dia_semana',
            'hora_inicio', 'hora_fin', 'activo',
        ]


class MesaExamenSerializer(serializers.ModelSerializer):
    llamado = serializers.IntegerField(read_only=True)
    dia_semana = serializers.CharField(read_only=True)
    materia_nombre = serializers.CharField(source='plan_materia.materia.__str__', read_only=True)
    espacio_nombre = serializers.CharField(source='espacio.__str__', read_only=True)

    class Meta:
        model = MesaExamen
        fields = ['id', 'plan_materia', 'espacio', 'materia_nombre', 'espacio_nombre', 'fecha', 'hora', 'turno', 'llamado', 'dia_semana', 'activo']


class EventoSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'tipo', 'tipo_otro', 'descripcion', 'fecha_hora_inicio', 'fecha_hora_fin', 'espacio', 'espacio_nombre']
        
    def get_espacio_nombre(self, obj):
        return str(obj.espacio) if obj.espacio else None


class AvisoSerializer(serializers.ModelSerializer):
    horario_cursado_str = serializers.SerializerMethodField()
    evento_str = serializers.SerializerMethodField()  
  
    class Meta:
        model = Aviso
        fields = ['id', 'horario_cursado', 'evento', 'horario_cursado_str', 'evento_str', 'fecha', 'motivo', 'tipo', 'tipo_otro', 'creado_en']
        read_only_fields = ['creado_en']

    def get_horario_cursado_str(self, obj):
        return str(obj.horario_cursado) if obj.horario_cursado else None

    def get_evento_str(self, obj):
        return str(obj.evento) if obj.evento else None


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
    espacio_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Totem
        fields = [
            'id', 'nombre', 'espacio_id', 'espacio_nombre',
            'config_pantalla', 'vinculado', 'creado_en',
        ]

    def get_espacio_nombre(self, obj):
        return str(obj.espacio) if obj.espacio else None
