from django.db import models


class Carrera(models.Model):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Carrera'
        verbose_name_plural = 'Carreras'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Materia(models.Model):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True)
    profesores = models.TextField(blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class CarreraMateria(models.Model):
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
    anio_plan = models.PositiveSmallIntegerField()
    cuatrimestre = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['carrera', 'anio_plan', 'cuatrimestre']
        unique_together = [
            ['carrera', 'materia', 'anio_plan', 'cuatrimestre'],
        ]
        verbose_name = 'Carrera - Materia'
        verbose_name_plural = 'Carreras - Materias'

    def __str__(self):
        return f'{self.carrera.codigo} - {self.materia.codigo} (Año {self.anio_plan}, Cuat {self.cuatrimestre})'


class HorarioCursado(models.Model):
    DIA_SEMANA = [
        ('lunes', 'Lunes'),
        ('martes', 'Martes'),
        ('miercoles', 'Miércoles'),
        ('jueves', 'Jueves'),
        ('viernes', 'Viernes'),
        ('sabado', 'Sábado'),
    ]

    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name='horarios',
    )
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.CASCADE,
        related_name='horarios',
    )
    dia_semana = models.CharField(max_length=15, choices=DIA_SEMANA)
    comision = models.CharField(max_length=50)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    fecha_inicio_vigencia = models.DateField()
    fecha_fin_vigencia = models.DateField()
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['materia', 'dia_semana', 'hora_inicio']
        verbose_name = 'Horario de cursado'
        verbose_name_plural = 'Horarios de cursado'

    def __str__(self):
        return f'{self.materia.codigo} - {self.dia_semana} {self.hora_inicio}-{self.hora_fin} ({self.comision})'


class MesaExamen(models.Model):
    TURNO = [
        ('febrero', 'Febrero'),
        ('julio', 'Julio'),
        ('diciembre', 'Diciembre'),
    ]

    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name='mesas_examen',
    )
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.CASCADE,
        related_name='mesas_examen',
    )
    fecha_hora = models.DateTimeField()
    turno = models.CharField(max_length=15, choices=TURNO)
    llamado = models.PositiveSmallIntegerField()
    tribunal = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['fecha_hora']
        verbose_name = 'Mesa de examen'
        verbose_name_plural = 'Mesas de examen'

    def __str__(self):
        return f'{self.materia.codigo} - {self.turno} Llamado {self.llamado}'
