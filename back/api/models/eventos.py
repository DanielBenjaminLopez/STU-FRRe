from django.core.exceptions import ValidationError
from django.db import models


class ActividadExtra(models.Model):
    TIPO = [
        ('taller', 'Taller'),
        ('curso', 'Curso'),
        ('evento', 'Evento'),
        ('charla', 'Charla'),
    ]

    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=50, choices=TIPO)
    descripcion = models.TextField(blank=True)
    fecha_hora_inicio = models.DateTimeField()
    fecha_hora_fin = models.DateTimeField()
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.CASCADE,
        related_name='actividades_extra',
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['fecha_hora_inicio']
        verbose_name = 'Actividad extra'
        verbose_name_plural = 'Actividades extra'

    def __str__(self):
        return self.titulo


class Suspension(models.Model):
    TIPO = [
        ('paro', 'Paro'),
        ('inasistencia', 'Inasistencia'),
        ('feriado', 'Feriado'),
    ]

    horario_cursado = models.ForeignKey(
        'HorarioCursado',
        on_delete=models.CASCADE,
        related_name='suspensiones',
        null=True,
        blank=True,
    )
    actividad_extra = models.ForeignKey(
        ActividadExtra,
        on_delete=models.CASCADE,
        related_name='suspensiones',
        null=True,
        blank=True,
    )
    fecha = models.DateField()
    motivo = models.CharField(max_length=300)
    tipo = models.CharField(max_length=50, choices=TIPO)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Suspensión'
        verbose_name_plural = 'Suspensiones'

    def __str__(self):
        return f'{self.tipo} - {self.fecha}'

    def clean(self):
        if not self.horario_cursado and not self.actividad_extra:
            raise ValidationError(
                'Debe referenciar un horario de cursado o una actividad extra.'
            )


class Noticias(models.Model):
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    fecha_publicacion = models.DateTimeField()
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = 'Noticia'
        verbose_name_plural = 'Noticias'

    def __str__(self):
        return self.titulo
