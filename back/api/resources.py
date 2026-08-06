from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget

from .models import (
    Aviso,
    Carrera,
    Comision,
    Espacio,
    Evento,
    EventoCalendario,
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
        fields = ('id', 'nombre', 'codigo')


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

    def before_import_row(self, row, **kwargs):
        """Permite resolver el plan_materia si se ingresan las columnas 'carrera' y 'materia'."""
        if not row.get('plan_materia'):
            carrera_nombre = row.get('carrera')
            materia_nombre = row.get('materia')
            plan_estudio = row.get('plan_estudio', '2023')

            if carrera_nombre and materia_nombre:
                try:
                    pm = PlanMateria.objects.get(
                        carrera__nombre=carrera_nombre,
                        materia__nombre=materia_nombre,
                        plan_estudio=plan_estudio,
                    )
                    row['plan_materia'] = pm.id
                except PlanMateria.DoesNotExist:
                    pass

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

    def before_import_row(self, row, **kwargs):
        """Permite resolver la comision si se envían columnas 'carrera', 'materia' y 'comision_nombre'."""
        if not row.get('comision'):
            carrera_nombre = row.get('carrera')
            materia_nombre = row.get('materia')
            comision_nombre = row.get('comision_nombre') or row.get('nombre_comision')
            plan_estudio = row.get('plan_estudio', '2023')

            if carrera_nombre and materia_nombre and comision_nombre:
                try:
                    com = Comision.objects.get(
                        plan_materia__carrera__nombre=carrera_nombre,
                        plan_materia__materia__nombre=materia_nombre,
                        plan_materia__plan_estudio=plan_estudio,
                        nombre=comision_nombre,
                    )
                    row['comision'] = com.id
                except Comision.DoesNotExist:
                    pass

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

    def before_import_row(self, row, **kwargs):
        """Permite resolver el plan_materia si se envían columnas 'carrera' y 'materia'."""
        if not row.get('plan_materia'):
            carrera_nombre = row.get('carrera')
            materia_nombre = row.get('materia')
            plan_estudio = row.get('plan_estudio', '2023')

            if carrera_nombre and materia_nombre:
                try:
                    pm = PlanMateria.objects.get(
                        carrera__nombre=carrera_nombre,
                        materia__nombre=materia_nombre,
                        plan_estudio=plan_estudio,
                    )
                    row['plan_materia'] = pm.id
                except PlanMateria.DoesNotExist:
                    pass

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

    def before_import_row(self, row, **kwargs):
        """Permite resolver horario_cursado o evento mediante nombres en lugar de IDs."""
        if not row.get('horario_cursado'):
            carrera = row.get('carrera')
            materia = row.get('materia')
            comision_nombre = row.get('comision_nombre') or row.get('nombre_comision')
            plan_estudio = row.get('plan_estudio', '2023')
            dia_semana = row.get('dia_semana')

            if carrera and materia and comision_nombre:
                try:
                    qs = HorarioCursado.objects.filter(
                        comision__plan_materia__carrera__nombre=carrera,
                        comision__plan_materia__materia__nombre=materia,
                        comision__plan_materia__plan_estudio=plan_estudio,
                        comision__nombre=comision_nombre,
                    )
                    if dia_semana:
                        qs = qs.filter(dia_semana=dia_semana)
                    horario = qs.first()
                    if horario:
                        row['horario_cursado'] = horario.id
                except Exception:
                    pass

        if not row.get('evento'):
            evento_titulo = row.get('evento_titulo') or row.get('titulo_evento')
            if evento_titulo:
                try:
                    ev = Evento.objects.filter(titulo=evento_titulo).first()
                    if ev:
                        row['evento'] = ev.id
                except Exception:
                    pass

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


class EventoCalendarioResource(resources.ModelResource):
    class Meta:
        model = EventoCalendario
        fields = (
            'id',
            'titulo',
            'tipo',
            'fecha_inicio',
            'fecha_fin',
            'todo_el_dia',
            'color',
            'descripcion',
            'creado_en',
            'actualizado_en',
        )
