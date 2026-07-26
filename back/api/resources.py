from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget

from .models import (
    Aviso,
    Carrera,
    Comision,
    Espacio,
    Evento,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    PlanMateria,
    Totem,
)


class EspacioResource(resources.ModelResource):
    class Meta:
        model = Espacio
        import_id_fields = ('nombre',)
        fields = ('id', 'nombre', 'tipo', 'tipo_otro', 'piso')


class CarreraResource(resources.ModelResource):
    class Meta:
        model = Carrera
        import_id_fields = ('nombre',)
        fields = ('id', 'nombre')


class MateriaResource(resources.ModelResource):
    class Meta:
        model = Materia
        import_id_fields = ('nombre',)
        fields = ('id', 'nombre')


class PlanMateriaResource(resources.ModelResource):
    carrera = fields.Field(
        column_name='carrera',
        attribute='carrera',
        widget=ForeignKeyWidget(Carrera, field='nombre'),
    )
    materia = fields.Field(
        column_name='materia',
        attribute='materia',
        widget=ForeignKeyWidget(Materia, field='nombre'),
    )

    class Meta:
        model = PlanMateria
        fields = (
            'id',
            'carrera',
            'materia',
            'nivel',
            'modalidad',
            'cuatrimestre',
            'plan_estudio',
        )


class ComisionResource(resources.ModelResource):
    plan_materia = fields.Field(
        column_name='plan_materia',
        attribute='plan_materia',
        widget=ForeignKeyWidget(PlanMateria, field='id'),
    )

    class Meta:
        model = Comision
        fields = ('id', 'plan_materia', 'nombre')


class HorarioCursadoResource(resources.ModelResource):
    comision = fields.Field(
        column_name='comision',
        attribute='comision',
        widget=ForeignKeyWidget(Comision, field='id'),
    )
    espacio = fields.Field(
        column_name='espacio',
        attribute='espacio',
        widget=ForeignKeyWidget(Espacio, field='nombre'),
    )

    class Meta:
        model = HorarioCursado
        fields = (
            'id',
            'comision',
            'espacio',
            'dia_semana',
            'hora_inicio',
            'hora_fin',
            'activo',
        )


class MesaExamenResource(resources.ModelResource):
    plan_materia = fields.Field(
        column_name='plan_materia',
        attribute='plan_materia',
        widget=ForeignKeyWidget(PlanMateria, field='id'),
    )
    espacio = fields.Field(
        column_name='espacio',
        attribute='espacio',
        widget=ForeignKeyWidget(Espacio, field='nombre'),
    )

    class Meta:
        model = MesaExamen
        fields = (
            'id',
            'plan_materia',
            'espacio',
            'fecha',
            'hora',
            'turno',
            'activo',
        )


class EventoResource(resources.ModelResource):
    espacio = fields.Field(
        column_name='espacio',
        attribute='espacio',
        widget=ForeignKeyWidget(Espacio, field='nombre'),
    )

    class Meta:
        model = Evento
        fields = (
            'id',
            'titulo',
            'tipo',
            'tipo_otro',
            'descripcion',
            'fecha_hora_inicio',
            'fecha_hora_fin',
            'espacio',
        )


class AvisoResource(resources.ModelResource):
    horario_cursado = fields.Field(
        column_name='horario_cursado',
        attribute='horario_cursado',
        widget=ForeignKeyWidget(HorarioCursado, field='id'),
    )
    evento = fields.Field(
        column_name='evento',
        attribute='evento',
        widget=ForeignKeyWidget(Evento, field='id'),
    )

    class Meta:
        model = Aviso
        fields = (
            'id',
            'horario_cursado',
            'evento',
            'fecha',
            'motivo',
            'tipo',
            'tipo_otro',
            'creado_en',
        )


class NoticiasResource(resources.ModelResource):
    class Meta:
        model = Noticias
        fields = (
            'id',
            'titulo',
            'contenido',
            'fecha_publicacion',
            'fecha_expiracion',
        )


class TotemResource(resources.ModelResource):
    espacio = fields.Field(
        column_name='espacio',
        attribute='espacio',
        widget=ForeignKeyWidget(Espacio, field='nombre'),
    )

    class Meta:
        model = Totem
        fields = (
            'id',
            'nombre',
            'espacio',
            'codigo_vinculacion',
            'vinculado',
            'config_pantalla',
            'creado_en',
        )
