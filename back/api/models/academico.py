from django.db import models


class Carrera(models.Model):
    TIPO = [
        ('grado', 'Grado'),
        ('tecnica', 'Tecnicatura'),
        ('posgrado', 'Posgrado'),
        ('diplomatura', 'Diplomatura'),
    ]

    nombre = models.CharField(max_length=200, unique=True)
    codigo = models.CharField(max_length=10, unique=True, null=True, blank=True, help_text='Código abreviado (ej: ISI, IEM, IQ, LAR)')
    tipo = models.CharField(max_length=15, choices=TIPO, default='grado')

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Carrera'
        verbose_name_plural = 'Carreras'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Materia(models.Model):
    NIVEL = [
        ('primero', 'Primer año'),
        ('segundo', 'Segundo año'),
        ('tercero', 'Tercer año'),
        ('cuarto', 'Cuarto año'),
        ('quinto', 'Quinto año'),
    ]

    nombre = models.CharField(max_length=200)
    carrera = models.ForeignKey(
        Carrera,
        on_delete=models.PROTECT,
        related_name='materias',
        null=True,
        blank=True,
    )
    nivel = models.CharField(max_length=10, choices=NIVEL, default='primero')

    class Meta:
        ordering = ['carrera', 'nivel', 'nombre']
        unique_together = [
            ['carrera', 'nombre', 'nivel'],
        ]
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'

    def __str__(self):
        return self.nombre


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
        null=True,
        blank=True,
    )
    comision = models.CharField(
        max_length=50,
        default='',
        blank=True,
        help_text='Ej: K1, K2, Curso 1, Única',
    )
    espacio = models.CharField(
        max_length=150,
        default='',
        blank=True,
        help_text='Ej: Aula 10, Laboratorio 4',
    )
    dia_semana = models.CharField(max_length=15, choices=DIA_SEMANA)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        ordering = ['materia', 'comision', 'dia_semana', 'hora_inicio', 'id']
        unique_together = [['materia', 'comision', 'espacio', 'dia_semana', 'hora_inicio', 'hora_fin']]
        verbose_name = 'Horario de cursado'
        verbose_name_plural = 'Horarios de cursado'

    def __str__(self):
        if self.materia:
            com = f' ({self.comision})' if self.comision else ''
            return f'{self.materia.nombre}{com} - {self.dia_semana} {self.hora_inicio}-{self.hora_fin}'
        return f'Horario #{self.id or "nuevo"} - {self.dia_semana} {self.hora_inicio}-{self.hora_fin}'


class MesaExamen(models.Model):
    carrera = models.ForeignKey(
        Carrera,
        on_delete=models.CASCADE,
        related_name='mesas_examen',
        null=True,
        blank=True,
    )
    materia = models.CharField(
        max_length=200,
        default='',
        help_text='Nombre de la materia',
    )
    espacio = models.CharField(
        max_length=150,
        default='',
        blank=True,
        help_text='Ej: Aula 10, Aula Magna',
    )
    fecha = models.DateField(default='2025-01-01')
    hora = models.TimeField(default='00:00')

    class Meta:
        ordering = ['fecha', 'hora']
        unique_together = [['carrera', 'materia', 'espacio', 'fecha', 'hora']]
        verbose_name = 'Mesa de examen'
        verbose_name_plural = 'Mesas de exámen'

    def __str__(self):
        if self.materia:
            return f'{self.materia} - {self.fecha} {self.hora}'
        return f'Mesa #{self.id or "nueva"} - {self.fecha} {self.hora}'

    @property
    def dia_semana(self):
        dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        return dias[self.fecha.weekday()]
