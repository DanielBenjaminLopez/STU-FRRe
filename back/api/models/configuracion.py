from django.db import models


class Totem(models.Model):
    nombre = models.CharField(max_length=150)
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.PROTECT,
        related_name='totems',
    )
    activo = models.BooleanField(default=True)
    config_pantalla = models.JSONField(default=dict)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Tótem'
        verbose_name_plural = 'Tótems'

    def __str__(self):
        return self.nombre
