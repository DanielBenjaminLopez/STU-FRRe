import random

from django.db import models
from django.utils import timezone


class Totem(models.Model):
    VINCULO_VIGENCIA_HORAS = 1

    nombre = models.CharField(max_length=150, blank=True, default='')
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.PROTECT,
        related_name='totems',
        null=True,
        blank=True,
    )
    codigo_vinculacion = models.CharField(
        max_length=10, unique=True, null=True, blank=True
    )
    vinculado = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    config_pantalla = models.JSONField(default=dict)
    creado_en = models.DateTimeField(auto_now_add=True)
    codigo_creado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Tótem'
        verbose_name_plural = 'Tótems'

    def __str__(self):
        return self.nombre or self.codigo_vinculacion or f'Tótem #{self.id}'

    @classmethod
    def generar_codigo(cls) -> str:
        while True:
            codigo = f'{random.randint(0, 99999):05d}'
            if not cls.objects.filter(codigo_vinculacion=codigo).exists():
                return codigo

    @property
    def codigo_valido(self) -> bool:
        if not self.codigo_creado_en or not self.codigo_vinculacion:
            return False
        if self.vinculado:
            return False
        vigencia = timezone.now() - self.codigo_creado_en
        return vigencia.total_seconds() < self.VINCULO_VIGENCIA_HORAS * 3600
