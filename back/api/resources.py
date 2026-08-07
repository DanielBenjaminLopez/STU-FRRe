from django.core.exceptions import ValidationError
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


def validar_hora(hora_str, nombre_campo):
    if not hora_str or not isinstance(hora_str, str) or not hora_str.strip():
        raise ValidationError(f"El campo '{nombre_campo}' es obligatorio.")
    h_str = hora_str.strip()
    parts = h_str.split(':')
    if len(parts) < 2:
        raise ValidationError(f"Formato de hora inválido en '{nombre_campo}' ('{h_str}'). Debe ser HH:MM (ej: 08:00, 15:30).")
    try:
        h, m = int(parts[0]), int(parts[1])
        if h < 0 or h > 23 or m < 0 or m > 59:
            raise ValidationError(f"Hora fuera de rango en '{nombre_campo}' ('{h_str}'). Debe ser un horario entre 00:00 y 23:59.")
    except ValueError:
        raise ValidationError(f"Formato de hora inválido en '{nombre_campo}' ('{h_str}'). Debe ser HH:MM (ej: 08:00, 15:30).")


def resolver_plan_materia(carrera_nombre, materia_nombre, plan_estudio_raw=None):
    if not carrera_nombre or not materia_nombre:
        return None
    c_str = str(carrera_nombre).strip()
    m_str = str(materia_nombre).strip()

    qs = PlanMateria.objects.filter(
        carrera__nombre__icontains=c_str,
        materia__nombre__iexact=m_str,
    )
    if not qs.exists():
        # Fallback si el nombre de la carrera difiere ligeramente o es una sigla
        qs = PlanMateria.objects.filter(materia__nombre__iexact=m_str)

    if plan_estudio_raw and str(plan_estudio_raw).strip():
        qs_plan = qs.filter(plan_estudio=str(plan_estudio_raw).strip())
        if qs_plan.exists():
            return qs_plan.first()

    return qs.first()


def resolver_comision(carrera_nombre, materia_nombre, comision_nombre, plan_estudio_raw=None):
    pm = resolver_plan_materia(carrera_nombre, materia_nombre, plan_estudio_raw)
    if not pm:
        return None
    c_nom = str(comision_nombre).strip()
    return Comision.objects.filter(plan_materia=pm, nombre__iexact=c_nom).first()


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
        """Validación estricta fila por fila para HorarioCursado."""
        # 1. Validar Carrera y Materia
        carrera_nombre = row.get('carrera') or row.get('Carrera')
        materia_nombre = row.get('materia') or row.get('Materia')
        if not carrera_nombre or not materia_nombre:
            raise ValidationError("Los campos 'carrera' y 'materia' son obligatorios.")

        # 2. Validar Comisión
        comision_nombre = (
            row.get('comision_nombre')
            or row.get('nombre_comision')
            or row.get('comision')
            or row.get('curso')
            or row.get('Curso')
        )
        if not comision_nombre:
            raise ValidationError("El campo 'comision' o 'comision_nombre' es obligatorio.")

        plan_estudio = row.get('plan_estudio') or row.get('Plan_Estudio')
        if not row.get('comision') or not isinstance(row.get('comision'), int):
            com = resolver_comision(carrera_nombre, materia_nombre, comision_nombre, plan_estudio)
            if com:
                row['comision'] = com.id
            else:
                raise ValidationError(
                    f"No existe la comisión '{comision_nombre}' para la materia '{materia_nombre}' (Carrera '{carrera_nombre}')."
                )

        # 3. Validar Espacio / Aula
        espacio_val = (
            row.get('espacio')
            or row.get('aula')
            or row.get('Aula')
            or row.get('AULA')
            or row.get('Espacio')
            or row.get('ESPACIO')
            or row.get('laboratorio')
            or row.get('Laboratorio')
        )
        if not espacio_val:
            raise ValidationError("El campo 'espacio' o 'aula' es obligatorio.")

        if not Espacio.objects.filter(nombre=espacio_val).exists():
            raise ValidationError(f"No existe el espacio o aula '{espacio_val}' en la base de datos.")

        row['espacio'] = espacio_val

        # 4. Validar Día de la semana
        dia_val = (
            row.get('dia_semana')
            or row.get('dia')
            or row.get('día')
            or row.get('Dia')
            or row.get('Día')
            or row.get('DIA')
            or row.get('DIA_SEMANA')
        )
        if not dia_val or not str(dia_val).strip():
            raise ValidationError("El campo 'dia_semana' es obligatorio y no puede estar vacío.")

        dia_norm = normalizar_dia_semana(dia_val)
        if dia_norm not in ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']:
            raise ValidationError(f"El día de la semana '{dia_val}' no es válido.")

        row['dia_semana'] = dia_norm

        # 5. Validar Horarios
        h_ini = row.get('hora_inicio') or row.get('hora_ini')
        h_fin = row.get('hora_fin') or row.get('hora_final')

        validar_hora(h_ini, "hora_inicio")
        validar_hora(h_fin, "hora_fin")

        row['hora_inicio'] = str(h_ini).strip()
        row['hora_fin'] = str(h_fin).strip()

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
        carrera_nombre = row.get('carrera') or row.get('Carrera')
        materia_nombre = row.get('materia') or row.get('Materia')
        if not carrera_nombre or not materia_nombre:
            raise ValidationError("Los campos 'carrera' y 'materia' son obligatorios.")

        plan_estudio = row.get('plan_estudio') or row.get('Plan_Estudio')
        if not row.get('plan_materia') or not isinstance(row.get('plan_materia'), int):
            pm = resolver_plan_materia(carrera_nombre, materia_nombre, plan_estudio)
            if pm:
                row['plan_materia'] = pm.id
            else:
                raise ValidationError(
                    f"No existe la materia '{materia_nombre}' para la carrera '{carrera_nombre}'."
                )

        espacio_val = (
            row.get('espacio')
            or row.get('aula')
            or row.get('Aula')
            or row.get('Espacio')
        )
        if not espacio_val:
            raise ValidationError("El campo 'espacio' o 'aula' es obligatorio.")
        if not Espacio.objects.filter(nombre=espacio_val).exists():
            raise ValidationError(f"No existe el espacio o aula '{espacio_val}' en la base de datos.")

        row['espacio'] = espacio_val

        fecha_val = row.get('fecha') or row.get('Fecha')
        if not fecha_val or not str(fecha_val).strip():
            raise ValidationError("El campo 'fecha' es obligatorio.")

        hora_val = row.get('hora') or row.get('Hora')
        validar_hora(hora_val, "hora")

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
