from django.core.exceptions import ValidationError
from django.db.models import Q
from import_export import fields, resources, widgets
from import_export.widgets import ForeignKeyWidget

from .models import (
    Aviso,
    Carrera,
    Evento,
    EventoCalendario,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Totem,
)


class CarreraResource(resources.ModelResource):
    class Meta:
        model = Carrera
        import_id_fields = ('nombre',)
        fields = ('id', 'nombre', 'codigo')


def normalizar_nivel(nivel_raw):
    if not nivel_raw or not isinstance(nivel_raw, str):
        return 'primero'
    n = nivel_raw.strip().lower()
    n = n.replace('º', '').replace('°', '')
    mapping = {
        '1': 'primero',
        '1ro': 'primero',
        '1er': 'primero',
        'primer': 'primero',
        'primero': 'primero',
        '2': 'segundo',
        '2do': 'segundo',
        'segundo': 'segundo',
        '3': 'tercero',
        '3ro': 'tercero',
        '3er': 'tercero',
        'tercer': 'tercero',
        'tercero': 'tercero',
        '4': 'cuarto',
        '4to': 'cuarto',
        'cuarto': 'cuarto',
        '5': 'quinto',
        '5to': 'quinto',
        'quinto': 'quinto',
    }
    return mapping.get(n, n)


class MateriaResource(resources.ModelResource):
    carrera = fields.Field(
        column_name='carrera',
        attribute='carrera',
        widget=ForeignKeyWidget(Carrera, field='nombre'),
    )

    def before_import(self, dataset, **kwargs):
        if dataset.headers and 'nombre' not in dataset.headers and 'materia' in dataset.headers:
            dataset.headers = [
                'nombre' if h == 'materia' else h for h in dataset.headers
            ]

    def before_import_row(self, row, **kwargs):
        if not row.get('nombre') and row.get('materia'):
            row['nombre'] = str(row.get('materia')).strip()
        row['nivel'] = normalizar_nivel(row.get('nivel'))

    class Meta:
        model = Materia
        import_id_fields = ('carrera', 'nombre')
        fields = (
            'id',
            'carrera',
            'nombre',
            'nivel',
        )


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


def resolver_carrera(carrera_str):
    if not carrera_str:
        return None
    c_str = str(carrera_str).strip()
    car = Carrera.objects.filter(codigo__iexact=c_str).first()
    if car:
        return car
    car = (
        Carrera.objects.filter(nombre__iexact=c_str).first()
        or Carrera.objects.filter(nombre__icontains=c_str).first()
    )
    if car:
        return car

    def sin_tildes(s):
        return (
            s.lower()
            .replace('á', 'a')
            .replace('é', 'e')
            .replace('í', 'i')
            .replace('ó', 'o')
            .replace('ú', 'u')
        )

    c_limpio = sin_tildes(c_str)
    for c in Carrera.objects.all():
        c_nom = sin_tildes(c.nombre)
        if c_nom == c_limpio or c_limpio in c_nom or c_nom in c_limpio or (c.codigo and c.codigo.lower() == c_limpio):
            return c
    return None


def resolver_materia(carrera_nombre, materia_nombre):
    if not carrera_nombre or not materia_nombre:
        return None
    raw_m = str(materia_nombre)
    m_str = raw_m.strip()

    m_filter = (
        Q(nombre__iexact=m_str)
        | Q(nombre__iexact=raw_m)
        | Q(nombre__istartswith=m_str)
    )

    car = resolver_carrera(carrera_nombre)
    if car:
        qs = Materia.objects.filter(carrera=car).filter(m_filter)
    else:
        c_str = str(carrera_nombre).strip()
        qs = Materia.objects.filter(
            Q(carrera__nombre__icontains=c_str) | Q(carrera__codigo__iexact=c_str)
        ).filter(m_filter)

    if not qs.exists():
        qs = Materia.objects.filter(m_filter)

    return qs.first()


class HorarioCursadoResource(resources.ModelResource):
    materia = fields.Field(
        column_name='materia',
        attribute='materia',
        widget=ForeignKeyWidget(Materia, field='id'),
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
        materia_val = row.get('materia') or row.get('Materia')
        if not carrera_nombre or not materia_val:
            raise ValidationError("Los campos 'carrera' y 'materia' son obligatorios.")

        if not isinstance(materia_val, int):
            mat = resolver_materia(carrera_nombre, materia_val)
            if mat:
                row['materia'] = mat.id
            else:
                raise ValidationError(
                    f"No existe la materia '{materia_val}' para la carrera '{carrera_nombre}'."
                )

        # 2. Validar Comisión (string en HorarioCursado)
        comision_nombre = (
            row.get('comision')
            or row.get('comision_nombre')
            or row.get('nombre_comision')
            or row.get('curso')
            or row.get('Curso')
        )
        if not comision_nombre or not str(comision_nombre).strip():
            raise ValidationError("El campo 'comision' es obligatorio.")
        row['comision'] = str(comision_nombre).strip()

        # 3. Espacio / Aula (string en HorarioCursado)
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
        row['espacio'] = str(espacio_val).strip() if espacio_val and str(espacio_val).strip() else ''

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
            raise ValidationError("El campo 'dia de la semana' es obligatorio y no puede estar vacío.")

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
        materia_id = row.get('materia')
        comision = str(row.get('comision') or '').strip()
        espacio_str = str(row.get('espacio') or row.get('aula') or row.get('Aula') or '').strip()
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
        if materia_id and comision and dia_semana and hora_inicio and hora_fin:
            exact = self._meta.model.objects.filter(
                materia_id=materia_id,
                comision=comision,
                espacio=espacio_str,
                dia_semana=dia_semana,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
            ).first()
            if exact:
                return exact

            orphan = self._meta.model.objects.filter(
                materia_id=materia_id,
                comision=comision,
                espacio='',
                dia_semana=dia_semana,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
            ).first()
            if orphan:
                return orphan

        return super().get_instance(instance_loader, row)

    class Meta:
        model = HorarioCursado
        skip_unchanged = True
        report_skipped = True
        fields = (
            'id',
            'materia',
            'comision',
            'espacio',
            'dia_semana',
            'hora_inicio',
            'hora_fin',
        )


class MesaExamenResource(resources.ModelResource):
    carrera = fields.Field(
        column_name='carrera',
        attribute='carrera',
        widget=ForeignKeyWidget(Carrera, field='id'),
    )

    def before_import_row(self, row, **kwargs):
        carrera_val = row.get('carrera') or row.get('Carrera')
        materia_val = row.get('materia') or row.get('Materia')
        if not carrera_val or not str(carrera_val).strip() or not materia_val or not str(materia_val).strip():
            raise ValidationError("Los campos 'carrera' y 'materia' son obligatorios.")

        if not isinstance(carrera_val, int):
            car = resolver_carrera(carrera_val)
            if car:
                row['carrera'] = car.id
            else:
                raise ValidationError(
                    f"No existe la carrera '{carrera_val}'."
                )

        row['materia'] = str(materia_val).strip()

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
        row['espacio'] = str(espacio_val).strip() if espacio_val and str(espacio_val).strip() else ''

        fecha_val = row.get('fecha') or row.get('Fecha')
        if not fecha_val or not str(fecha_val).strip():
            raise ValidationError("El campo 'fecha' es obligatorio.")

        fecha_str = str(fecha_val).strip()
        if '/' in fecha_str:
            partes = fecha_str.split('/')
            if len(partes) == 3 and len(partes[2]) == 4:
                fecha_str = f"{partes[2]}-{partes[1].zfill(2)}-{partes[0].zfill(2)}"
        row['fecha'] = fecha_str

        hora_val = row.get('hora') or row.get('Hora')
        validar_hora(hora_val, "hora")
        row['hora'] = str(hora_val).strip()

    def get_instance(self, instance_loader, row):
        carrera_id = row.get('carrera')
        materia_str = str(row.get('materia') or '').strip()
        espacio_str = str(row.get('espacio') or '').strip()
        fecha = row.get('fecha')
        hora = row.get('hora')
        if carrera_id and materia_str and fecha and hora:
            exact = self._meta.model.objects.filter(
                carrera_id=carrera_id,
                materia=materia_str,
                espacio=espacio_str,
                fecha=fecha,
                hora=hora,
            ).first()
            if exact:
                return exact

            if espacio_str:
                orphan = self._meta.model.objects.filter(
                    carrera_id=carrera_id,
                    materia=materia_str,
                    espacio='',
                    fecha=fecha,
                    hora=hora,
                ).first()
                if orphan:
                    return orphan
        return super().get_instance(instance_loader, row)

    class Meta:
        model = MesaExamen
        skip_unchanged = True
        report_skipped = True
        fields = (
            'id',
            'carrera',
            'materia',
            'espacio',
            'fecha',
            'hora',
        )


class EventoResource(resources.ModelResource):
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
            comision_nombre = row.get('comision') or row.get('comision_nombre') or row.get('nombre_comision')
            dia_semana = row.get('dia_semana')

            if carrera and materia and comision_nombre:
                try:
                    mat = resolver_materia(carrera, materia)
                    if mat:
                        qs = HorarioCursado.objects.filter(materia=mat, comision__iexact=str(comision_nombre).strip())
                        if dia_semana:
                            dia_norm = normalizar_dia_semana(dia_semana)
                            qs = qs.filter(dia_semana=dia_norm)
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
    class Meta:
        model = Totem
        fields = (
            'id',
            'nombre',
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
