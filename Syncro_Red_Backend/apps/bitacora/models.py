from django.db import models
from apps.usuarios.models import Usuario


class ReporteFinal(models.Model):
    fecha = models.DateField()
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reportes_finales', to_field='rut', db_column='usuario')
    cargo = models.CharField(max_length=50, blank=True)
    resumen_texto = models.TextField(blank=True)       # reporte operativo (tripulación + jefatura)
    reporte_detallado = models.TextField(blank=True)   # reporte auditoría (solo jefatura / admin)
    reporte_texto = models.TextField(blank=True)       # campo legado
    justificacion_cierre = models.TextField(blank=True)
    maquinista = models.CharField(max_length=150, blank=True)
    ayudante   = models.CharField(max_length=150, blank=True)
    hash_simple = models.CharField(max_length=64, blank=True)    # SHA-256 reporte operativo
    hash_detallado = models.CharField(max_length=64, blank=True) # SHA-256 reporte auditoría
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reportes_finales'

    def __str__(self):
        return f"Reporte {self.usuario} - {self.fecha}"


class NovedadOperativa(models.Model):
    CATEGORIA_ATRASO_CHOICES = [
        ('LEVE', 'Leve'),
        ('MODERADO', 'Moderado'),
        ('GRAVE', 'Grave'),
    ]

    reporte = models.ForeignKey(ReporteFinal, on_delete=models.CASCADE, related_name='novedades', db_column='reporte_id')
    fecha = models.DateField()
    tren_num = models.CharField(max_length=20, blank=True)
    equipo_id = models.CharField(max_length=20, blank=True)
    estacion = models.CharField(max_length=100, blank=True)
    tipo = models.CharField(max_length=50, blank=True)
    minutos = models.IntegerField(default=0)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_ATRASO_CHOICES, blank=True)
    detalle = models.TextField(blank=True)
    hora_programada = models.CharField(max_length=10, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'novedades_operativas'

    def __str__(self):
        return f"Novedad {self.tren_num} - {self.estacion}"
