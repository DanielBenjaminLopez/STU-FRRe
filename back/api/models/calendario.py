from django.db import models


class EventoCalendario(models.Model):
    TIPO_CHOICES = [
        ('inicio_cuatrimestre', 'Inicio de Cuatrimestre'),
        ('fin_cuatrimestre', 'Fin de Cuatrimestre'),
        ('mesa_examen', 'Mesa de Examen'),
        ('receso_invernal', 'Receso Invernal'),
        ('feriado', 'Feriado'),
        ('otro', 'Otro'),
    ]

    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        help_text='Para eventos de rango. Si es null, es un evento puntual.',
    )
    todo_el_dia = models.BooleanField(default=True)
    color = models.CharField(
        max_length=7,
        blank=True,
        default='',
        help_text='Color hex opcional para override (ej: #FF5733).',
    )
    descripcion = models.TextField(blank=True, default='')
    documento_fuente = models.FileField(
        upload_to='calendario/',
        null=True,
        blank=True,
        help_text='PDF o imagen del calendario oficial.',
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['fecha_inicio']
        verbose_name = 'Evento de Calendario'
        verbose_name_plural = 'Eventos de Calendario'

    def __str__(self):
        return f'{self.titulo} ({self.fecha_inicio})'

    @property
    def es_rango(self):
        return self.fecha_fin is not None
