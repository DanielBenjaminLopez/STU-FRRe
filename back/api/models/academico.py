from django.db import models


class Carrera(models.Model):
    nombre = models.CharField(max_length=200, unique=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Carrera'
        verbose_name_plural = 'Carreras'

    def __str__(self):
        return self.nombre


class Materia(models.Model):
    nombre = models.CharField(max_length=200, unique=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'

    def __str__(self):
        return self.nombre


class PlanMateria(models.Model):
    NIVEL = [
        ('primero', 'Primer año'),
        ('segundo', 'Segundo año'),
        ('tercero', 'Tercer año'),
        ('cuarto', 'Cuarto año'),
        ('quinto', 'Quinto año'),
    ]

    MODALIDAD = [
        ('anual', 'Anual'),
        ('cuatrimestral', 'Cuatrimestral'),
    ]

    CUATRIMESTRE = [
        ('primero', 'Primero'),
        ('segundo', 'Segundo'),
    ]

    PLAN_ESTUDIO = [
        ('2023', 'Plan 2023'),
        ('2008', 'Plan 2008'),
    ]

    carrera = models.ForeignKey(
        Carrera,
        on_delete=models.PROTECT,
        related_name='materias',
    )
    materia = models.ForeignKey(
        Materia,
        on_delete=models.PROTECT,
        related_name='carreras',
    )
    nivel = models.CharField(max_length=10, choices=NIVEL, default='primero')
    modalidad = models.CharField(max_length=15, choices=MODALIDAD, default='cuatrimestral')
    cuatrimestre = models.CharField(
        max_length=10,
        choices=CUATRIMESTRE,
        null=True,
        blank=True,
        help_text='Completar solo si la modalidad es Cuatrimestral.',
    )
    plan_estudio = models.CharField(max_length=4, choices=PLAN_ESTUDIO, default='2023')

    class Meta:
        ordering = ['carrera', 'nivel', 'cuatrimestre']
        unique_together = [
            ['carrera', 'materia', 'nivel', 'plan_estudio'],
        ]
        verbose_name = 'Plan - Materia'
        verbose_name_plural = 'Plan - Materias'

    def __str__(self):
        cuatrimestre_str = f', {self.get_cuatrimestre_display()} cuatrimestre' if self.cuatrimestre else ''
        return (
            f'{self.carrera.nombre} — {self.materia.nombre} '
            f'({self.get_nivel_display()}{cuatrimestre_str}, Plan {self.plan_estudio})'
        )

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.modalidad == 'cuatrimestral' and not self.cuatrimestre:
            raise ValidationError(
                {'cuatrimestre': 'Debe indicar el cuatrimestre cuando la modalidad es Cuatrimestral.'}
            )
        if self.modalidad == 'anual' and self.cuatrimestre:
            raise ValidationError(
                {'cuatrimestre': 'Las materias anuales no tienen cuatrimestre.'}
            )


class Comision(models.Model):
    plan_materia = models.ForeignKey(
        PlanMateria,
        on_delete=models.CASCADE,
        related_name='comisiones',
    )
    nombre = models.CharField(max_length=50, help_text='Ej: K1, K2, Única')

    class Meta:
        ordering = ['plan_materia', 'nombre']
        unique_together = [['plan_materia', 'nombre']]
        verbose_name = 'Comisión'
        verbose_name_plural = 'Comisiones'

    def __str__(self):
        if self.plan_materia and hasattr(self.plan_materia, 'materia') and hasattr(self.plan_materia, 'carrera'):
            return f'{self.plan_materia.materia.nombre} — {self.nombre} ({self.plan_materia.carrera.nombre})'
        return f'Comisión {self.nombre}'


class HorarioCursado(models.Model):
    DIA_SEMANA = [
        ('lunes', 'Lunes'),
        ('martes', 'Martes'),
        ('miercoles', 'Miércoles'),
        ('jueves', 'Jueves'),
        ('viernes', 'Viernes'),
        ('sabado', 'Sábado'),
    ]

    comision = models.ForeignKey(
        Comision,
        on_delete=models.CASCADE,
        related_name='horarios',
        null=True,
        blank=True,
    )
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.CASCADE,
        related_name='horarios',
    )
    dia_semana = models.CharField(max_length=15, choices=DIA_SEMANA)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['comision', 'dia_semana', 'hora_inicio']
        verbose_name = 'Horario de cursado'
        verbose_name_plural = 'Horarios de cursado'

    def __str__(self):
        if self.comision and hasattr(self.comision, 'plan_materia') and hasattr(self.comision.plan_materia, 'materia'):
            materia = self.comision.plan_materia.materia.nombre
            return f'{materia} ({self.comision.nombre}) - {self.dia_semana} {self.hora_inicio}-{self.hora_fin}'
        return f'Horario #{self.id or "nuevo"} - {self.dia_semana} {self.hora_inicio}-{self.hora_fin}'


class MesaExamen(models.Model):
    TURNO = [
        ('febrero', 'Febrero'),
        ('marzo', 'Marzo'),
        ('abril', 'Abril'),
        ('junio', 'Junio'),
        ('agosto', 'Agosto'),
        ('septiembre', 'Septiembre'),
        ('octubre', 'Octubre'),
        ('diciembre', 'Diciembre'),
    ]

    LLAMADO_POR_TURNO = {
        'febrero': 1,
        'marzo': 2,
        'abril': 3,
        'junio': 4,
        'agosto': 5,
        'septiembre': 6,
        'octubre': 7,
        'diciembre': 8,
    }

    plan_materia = models.ForeignKey(
        PlanMateria,
        on_delete=models.CASCADE,
        related_name='mesas_examen',
        null=True,
        blank=True,
    )
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.CASCADE,
        related_name='mesas_examen',
    )
    fecha = models.DateField(default='2025-01-01')
    hora = models.TimeField(default='00:00')
    turno = models.CharField(max_length=15, choices=TURNO, default='febrero')
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['fecha', 'hora']
        verbose_name = 'Mesa de examen'
        verbose_name_plural = 'Mesas de exámen'

    def __str__(self):
        if self.plan_materia and hasattr(self.plan_materia, 'materia'):
            materia = self.plan_materia.materia.nombre
            return f'{materia} - {self.get_turno_display()} ({self.llamado}° llamado)'
        return f'Mesa #{self.id or "nueva"} - {self.get_turno_display()}'

    @property
    def llamado(self):
        return self.LLAMADO_POR_TURNO.get(self.turno)

    @property
    def dia_semana(self):
        dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        return dias[self.fecha.weekday()]

