from django.db import models


class Evento(models.Model):
    TIPO = [
        ('taller', 'Taller'),
        ('curso', 'Curso'),
        ('evento', 'Evento'),
        ('charla', 'Charla'),
        ('otro', 'Otro'),
    ]

    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=50, choices=TIPO)
    tipo_otro = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Completar solo si el tipo es "Otro".',
    )
    descripcion = models.TextField(blank=True)
    fecha_hora_inicio = models.DateTimeField()
    fecha_hora_fin = models.DateTimeField()
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.CASCADE,
        related_name='eventos',
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['fecha_hora_inicio']
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'

    def __str__(self):
        return self.titulo

    def clean(self):
        if self.tipo == 'otro' and not self.tipo_otro:
            raise ValidationError(
                {'tipo_otro': 'Debe especificar el tipo de actividad cuando selecciona "Otro".'}
            )
        if self.tipo != 'otro' and self.tipo_otro:
            raise ValidationError(
                {'tipo_otro': 'Este campo solo se completa cuando el tipo es "Otro".'}
            )


class Aviso(models.Model):
    TIPO = [
        ('paro', 'Paro'),
        ('inasistencia', 'Inasistencia'),
        ('feriado', 'Feriado'),
        ('otro', 'Otro'),
    ]

    horario_cursado = models.ForeignKey(
        'HorarioCursado',
        on_delete=models.CASCADE,
        related_name='avisos',
        null=True,
        blank=True,
    )
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name='avisos',
        null=True,
        blank=True,
    )
    fecha = models.DateField()
    motivo = models.CharField(max_length=300)
    tipo = models.CharField(max_length=50, choices=TIPO)
    tipo_otro = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Completar solo si el tipo es "Otro".',
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Aviso'
        verbose_name_plural = 'Avisos'

    def __str__(self):
        return f'{self.tipo} - {self.fecha}'

    def clean(self):
        if not self.horario_cursado and not self.evento:
            raise ValidationError(
                'Debe referenciar un horario de cursado o un evento.'
            )
        if self.tipo == 'otro' and not self.tipo_otro:
            raise ValidationError(
                {'tipo_otro': 'Debe especificar el motivo cuando selecciona "Otro".'}
            )
        if self.tipo != 'otro' and self.tipo_otro:
            raise ValidationError(
                {'tipo_otro': 'Este campo solo se completa cuando el tipo es "Otro".'}
            )


class Noticias(models.Model):
    ORIGEN_CHOICES = [
        ('manual', 'Manual'),
        ('scraping', 'Scraping'),
    ]

    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    fecha_publicacion = models.DateTimeField()
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    imagen_url = models.URLField(max_length=500, blank=True, default='')
    enlace = models.URLField(max_length=500, blank=True, default='')
    origen = models.CharField(max_length=10, choices=ORIGEN_CHOICES, default='manual')

    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = 'Noticia'
        verbose_name_plural = 'Noticias'

    def __str__(self):
        return self.titulo
