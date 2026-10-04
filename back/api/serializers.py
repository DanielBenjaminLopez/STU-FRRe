from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Aviso,
    Carrera,
    EventoCalendario,
    Evento,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Plantilla,
    PlantillaWidget,
    Totem,
    UbicacionMapa,
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
GRID_ROWS = 6


def _validar_rango_posicion(col_pos, fila_pos, col_tam, fila_tam):
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

    if fila_pos < 0 or fila_pos >= GRID_ROWS:
        raise serializers.ValidationError({"fila_pos": f"La posición de la fila debe estar entre 0 y {GRID_ROWS - 1}."})

    if fila_pos + fila_tam > GRID_ROWS:
        raise serializers.ValidationError(
            {"fila_tam": f"El widget sobrepasa el límite de {GRID_ROWS} filas de la grilla (fila_pos: {fila_pos} + fila_tam: {fila_tam})."}
        )


class PlantillaWidgetPosicionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantillaWidget
        fields = ['widget', 'col_pos', 'fila_pos', 'col_tam', 'fila_tam']

    def validate(self, data):
        _validar_rango_posicion(
            data.get('col_pos', 0),
            data.get('fila_pos', 0),
            data.get('col_tam', 1),
            data.get('fila_tam', 1),
        )
        return data


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

        _validar_rango_posicion(col_pos, fila_pos, col_tam, fila_tam)

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


def validar_solapamiento_payload(items):
    for i, item in enumerate(items):
        for j in range(i):
            prev = items[j]
            colide_x = (
                item['col_pos'] < prev['col_pos'] + prev['col_tam']
                and item['col_pos'] + item['col_tam'] > prev['col_pos']
            )
            colide_y = (
                item['fila_pos'] < prev['fila_pos'] + prev['fila_tam']
                and item['fila_pos'] + item['fila_tam'] > prev['fila_pos']
            )
            if colide_x and colide_y:
                raise serializers.ValidationError(
                    f"El widget '{item['widget'].nombre}' se superpone con el "
                    f"widget '{prev['widget'].nombre}' en la posición "
                    f"({item['col_pos']}, {item['fila_pos']})."
                )



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
        fields = ['id', 'nombre', 'codigo', 'tipo']


class MateriaSerializer(serializers.ModelSerializer):
    carrera_nombre = serializers.CharField(source='carrera.nombre', read_only=True)
    carrera_codigo = serializers.CharField(source='carrera.codigo', read_only=True)
    carrera_tipo = serializers.CharField(source='carrera.tipo', read_only=True)

    class Meta:
        model = Materia
        fields = [
            'id', 'nombre', 'carrera',
            'carrera_nombre', 'carrera_codigo', 'carrera_tipo', 'nivel',
        ]


class HorarioCursadoSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    carrera_codigo = serializers.CharField(source='materia.carrera.codigo', read_only=True)
    carrera_nombre = serializers.CharField(source='materia.carrera.nombre', read_only=True)
    nivel = serializers.CharField(source='materia.nivel', read_only=True)
    espacio = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        default='',
    )

    class Meta:
        model = HorarioCursado
        fields = [
            'id', 'materia', 'comision', 'espacio',
            'materia_nombre', 'carrera_codigo',
            'carrera_nombre', 'nivel', 'dia_semana', 'hora_inicio', 'hora_fin',
        ]


class MesaExamenSerializer(serializers.ModelSerializer):
    dia_semana = serializers.CharField(read_only=True)
    materia_nombre = serializers.CharField(source='materia', read_only=True)
    carrera_codigo = serializers.SerializerMethodField()
    carrera_nombre = serializers.SerializerMethodField()
    espacio = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        default='',
    )

    class Meta:
        model = MesaExamen
        fields = [
            'id', 'carrera', 'carrera_codigo', 'carrera_nombre',
            'materia', 'materia_nombre', 'espacio',
            'fecha', 'hora', 'dia_semana',
        ]

    def get_carrera_codigo(self, obj):
        if obj.carrera and obj.carrera.codigo:
            return obj.carrera.codigo
        return ""

    def get_carrera_nombre(self, obj):
        if obj.carrera and obj.carrera.nombre:
            return obj.carrera.nombre
        return ""


class EventoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    espacio = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')

    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'tipo', 'tipo_otro', 'descripcion', 'fecha_hora_inicio', 'fecha_hora_fin', 'imagen_url', 'espacio', 'destacado']


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
    enlace = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Noticias
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'fecha_expiracion', 'imagen_url', 'enlace', 'origen']

    def to_internal_value(self, data):
        if data.get('fecha_expiracion') == '':
            data = {**data, 'fecha_expiracion': None}
        if data.get('imagen_url') == '':
            data = {**data, 'imagen_url': ''}
        if data.get('enlace') == '':
            data = {**data, 'enlace': ''}
        return super().to_internal_value(data)


class UbicacionMapaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    piso_display = serializers.CharField(source='get_piso_display', read_only=True)

    class Meta:
        model = UbicacionMapa
        fields = ['id', 'svg_id', 'nombre', 'tipo', 'tipo_display', 'piso', 'piso_display']
        read_only_fields = ['svg_id', 'piso']


class TotemNuevoSerializer(serializers.Serializer):
    codigo_vinculacion = serializers.CharField(read_only=True)

    def create(self, validated_data):
        # Limpiar tótems no vinculados cuyo código haya expirado
        limite_expiracion = timezone.now() - timedelta(minutes=Totem.VINCULO_VIGENCIA_MINUTOS)
        Totem.objects.filter(vinculado=False, codigo_creado_en__lt=limite_expiracion).delete()

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

    def create(self, validated_data):
        totem = self._totem
        totem.nombre = validated_data['nombre']
        totem.vinculado = True
        totem.codigo_vinculacion = None
        totem.codigo_creado_en = None
        totem.save()
        return totem


class TotemSerializer(serializers.ModelSerializer):
    plantilla = PlantillaSerializer(read_only=True)
    plantilla_id = serializers.PrimaryKeyRelatedField(
        source='plantilla',
        queryset=Plantilla.objects.all(),
        allow_null=True,
        required=False,
    )
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = Totem
        fields = [
            'id', 'nombre',
            'config_pantalla', 'vinculado', 'activo',
            'plantilla_id', 'plantilla', 'creado_en',
            'pin_mapa_piso', 'pin_mapa_svg_x', 'pin_mapa_svg_y', 'pin_mapa_orientacion',
            'video_archivo', 'video_url', 'video_intervalo', 'video_activo',
        ]
        read_only_fields = ['vinculado', 'creado_en']

    def get_video_url(self, obj):
        if obj.video_archivo:
            return obj.video_archivo.url
        return None


class EventoCalendarioSerializer(serializers.ModelSerializer):
    es_rango = serializers.BooleanField(read_only=True)
    documento_fuente_url = serializers.SerializerMethodField()

    class Meta:
        model = EventoCalendario
        fields = [
            'id', 'titulo', 'tipo', 'fecha_inicio', 'fecha_fin',
            'es_rango', 'todo_el_dia', 'color', 'descripcion',
            'documento_fuente', 'documento_fuente_url',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['creado_en', 'actualizado_en']

    def get_documento_fuente_url(self, obj):
        if obj.documento_fuente:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.documento_fuente.url)
            return obj.documento_fuente.url
        return None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except Exception:
            raise serializers.ValidationError(
                {"detail": "Usuario o contraseña incorrectos."}
            )
