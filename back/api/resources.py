from import_export import fields, resources, widgets
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


def normalizar_dia_semana(dia_raw):
    if not dia_raw or not isinstance(dia_raw, str):
        return dia_raw
    d = dia_raw.strip().lower()
    d = d.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    mapping = {
        'lun': 'lunes',
        'lunes': 'lunes',
        'mar': 'martes',
        'martes': 'martes',
        'mie': 'miercoles',
        'miercoles': 'miercoles',
        'jue': 'jueves',
        'jueves': 'jueves',
        'vie': 'viernes',
        'viernes': 'viernes',
        'sab': 'sabado',
        'sabado': 'sabado',
        'dom': 'domingo',
        'domingo': 'domingo',
    }
    return mapping.get(d, d)


class NormalisedDiaSemanaWidget(widgets.CharWidget):
    def clean(self, value, row=None, **kwargs):
        val = super().clean(value, row, **kwargs)
        return normalizar_dia_semana(val)


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
    dia_semana = fields.Field(
        column_name='dia_semana',
        attribute='dia_semana',
        widget=NormalisedDiaSemanaWidget(),
    )

    def before_import_row(self, row, **kwargs):
        """Permite resolver la comision, espacio y normalizar el día de la semana con soporte para variaciones de encabezado."""
        # Fallback de encabezados para dia_semana (ej: dia, día, Día, DIA)
        dia_val = (
            row.get('dia_semana')
            or row.get('dia')
            or row.get('día')
            or row.get('Dia')
            or row.get('Día')
            or row.get('DIA')
            or row.get('DIA_SEMANA')
        )
        if dia_val:
            row['dia_semana'] = normalizar_dia_semana(dia_val)

        # Fallback de encabezados para espacio (ej: aula, Aula, Espacio)
        if not row.get('espacio'):
            espacio_val = (
                row.get('aula')
                or row.get('Aula')
                or row.get('AULA')
                or row.get('Espacio')
                or row.get('ESPACIO')
                or row.get('laboratorio')
                or row.get('Laboratorio')
            )
            if espacio_val:
                row['espacio'] = espacio_val

        # Fallback para horas
        if not row.get('hora_inicio') and row.get('hora_ini'):
            row['hora_inicio'] = row.get('hora_ini')
        if not row.get('hora_fin') and row.get('hora_final'):
            row['hora_fin'] = row.get('hora_final')

        if not row.get('comision'):
            carrera_nombre = row.get('carrera')
            materia_nombre = row.get('materia')
            comision_nombre = row.get('comision_nombre') or row.get('nombre_comision') or row.get('comision') or row.get('curso') or row.get('Curso')
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

    def get_instance(self, instance_loader, row):
        comision_id = row.get('comision')
        espacio_val = row.get('espacio') or row.get('aula') or row.get('Aula')
        dia_raw = (
            row.get('dia_semana')
            or row.get('dia')
            or row.get('día')
            or row.get('Dia')
            or row.get('Día')
        )
        dia_semana = normalizar_dia_semana(dia_raw)
        hora_inicio = row.get('hora_inicio') or row.get('hora_ini')
        hora_fin = row.get('hora_fin') or row.get('hora_final')
        if comision_id and espacio_val and dia_semana and hora_inicio and hora_fin:
            try:
                espacio_id = espacio_val if isinstance(espacio_val, int) else Espacio.objects.filter(nombre=espacio_val).values_list('id', flat=True).first()
                if espacio_id:
                    return self._meta.model.objects.get(
                        comision_id=comision_id,
                        espacio_id=espacio_id,
                        dia_semana=dia_semana,
                        hora_inicio=hora_inicio,
                        hora_fin=hora_fin,
                    )
            except self._meta.model.DoesNotExist:
                return None
        return super().get_instance(instance_loader, row)

    class Meta:
        model = HorarioCursado
        skip_unchanged = True
        report_skipped = True
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

    def get_instance(self, instance_loader, row):
        plan_materia_id = row.get('plan_materia')
        espacio_val = row.get('espacio')
        fecha = row.get('fecha')
        hora = row.get('hora')
        turno = row.get('turno')
        if plan_materia_id and espacio_val and fecha and hora and turno:
            try:
                espacio_id = espacio_val if isinstance(espacio_val, int) else Espacio.objects.filter(nombre=espacio_val).values_list('id', flat=True).first()
                if espacio_id:
                    return self._meta.model.objects.get(
                        plan_materia_id=plan_materia_id,
                        espacio_id=espacio_id,
                        fecha=fecha,
                        hora=hora,
                        turno=turno,
                    )
            except self._meta.model.DoesNotExist:
                return None
        return super().get_instance(instance_loader, row)

    class Meta:
        model = MesaExamen
        skip_unchanged = True
        report_skipped = True
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
