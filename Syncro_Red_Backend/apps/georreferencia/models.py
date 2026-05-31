from django.db import models


class HitoGeorreferencia(models.Model):
    TIPO_CHOICES = [
        ('ESTACION', 'Estación'),
        ('PUENTE', 'Puente'),
        ('TUNEL', 'Túnel'),
        ('CRUCE', 'Cruce'),
        ('SEÑAL', 'Señal'),
        ('OTRO', 'Otro'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='ESTACION')
    nombre = models.CharField(max_length=100)
    punto_kilometrico = models.FloatField(null=True, blank=True, db_column='pk')
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    descripcion = models.TextField(blank=True)
    creado_por = models.CharField(max_length=100, blank=True)
    ts_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hitos_georreferencia'

    def __str__(self):
        return f"{self.nombre} (PK {self.punto_kilometrico})"
