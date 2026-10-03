from django.db import models


class UbicacionMapa(models.Model):
    """Representa una ubicación (polígono) dentro del SVG del mapa interactivo del tótem."""

    TIPO_CHOICES = [
        ('aula', 'Aula'),
        ('oficina', 'Oficina'),
        ('departamento', 'Departamento'),
        ('secretaria', 'Secretaría'),
        ('laboratorio', 'Laboratorio'),
        ('servicio', 'Servicio'),
        ('escaleras', 'Escaleras'),
        ('ascensor', 'Ascensor'),
        ('baños', 'Baños'),
        ('otro', 'Otro'),
    ]

    PISO_CHOICES = [
        ('baja', 'Planta Baja'),
        ('primero', 'Primer Piso'),
        ('segundo', 'Segundo Piso'),
    ]

    svg_id = models.CharField(
        max_length=50,
        help_text='Identificador del polígono en el SVG (ej: "1", "escaleras1", "baño2").',
    )
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='otro')
    piso = models.CharField(max_length=10, choices=PISO_CHOICES)

    class Meta:
        ordering = ['piso', 'svg_id']
        unique_together = [('svg_id', 'piso')]
        verbose_name = 'Ubicación en Mapa'
        verbose_name_plural = 'Ubicaciones en Mapa'

    def __str__(self):
        return f'{self.nombre} ({self.svg_id} — {self.get_piso_display()})'

