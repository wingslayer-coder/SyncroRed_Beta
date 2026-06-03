from django.db import models
from apps.usuarios.models import Usuario


class ServicioActivo(models.Model):
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('CERRADO', 'Cerrado'),
        ('EMERGENCIA', 'Emergencia'),
    ]

    fecha = models.DateField()
    tren_num = models.CharField(max_length=20)
    equipo_id = models.CharField(max_length=20, blank=True)
    maquinista = models.CharField(max_length=100, blank=True)
    ayudante = models.CharField(max_length=100, blank=True)
    rut_maquinista = models.CharField(max_length=20, blank=True)
    rut_ayudante = models.CharField(max_length=20, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    timestamp_gps = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'servicios_activos'
        unique_together = ['fecha', 'tren_num']

    def __str__(self):
        return f"Tren {self.tren_num} - {self.fecha}"


class ServicioHistorico(models.Model):
    fecha = models.DateField()
    tren_num = models.CharField(max_length=20)
    equipo_id = models.CharField(max_length=20, blank=True)
    maquinista = models.CharField(max_length=100, blank=True)
    ayudante = models.CharField(max_length=100, blank=True)
    rut_maquinista = models.CharField(max_length=20, blank=True)
    rut_ayudante = models.CharField(max_length=20, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, default='CERRADO')

    class Meta:
        db_table = 'servicios_historicos'
        unique_together = ['fecha', 'tren_num']

    def __str__(self):
        return f"Hist Tren {self.tren_num} - {self.fecha}"


class RegistroEstacion(models.Model):
    ESTADO_CHOICES = [
        ('A LA HORA', 'A la hora'),
        ('ATRASO', 'Atraso'),
        ('SIN MARCAR', 'Sin marcar'),
    ]

    fecha = models.DateField()
    tren_num = models.CharField(max_length=20)
    estacion_id = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='SIN MARCAR')
    color = models.CharField(max_length=20, blank=True)
    obs = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'registros_estaciones'
        unique_together = ['fecha', 'tren_num', 'estacion_id']

    def __str__(self):
        return f"{self.tren_num} @ {self.estacion_id} ({self.estado})"


class MaestroTurno(models.Model):
    num_turno = models.CharField(max_length=10)
    tipo_dia = models.CharField(max_length=20)
    apertura_lugar = models.CharField(max_length=100, blank=True)
    apertura_hora = models.CharField(max_length=10, blank=True)
    presentacion_lugar = models.CharField(max_length=100, blank=True)
    presentacion_hora = models.CharField(max_length=10, blank=True)
    servicios = models.TextField(blank=True)
    cierre_lugar = models.CharField(max_length=100, blank=True)
    cierre_hora = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = 'maestro_turnos'
        unique_together = ['num_turno', 'tipo_dia']

    def __str__(self):
        return f"Turno {self.num_turno} ({self.tipo_dia})"


class GraficoMensual(models.Model):
    fecha = models.DateField()
    rut = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='grafico_mensual', to_field='rut', db_column='rut')
    num_turno = models.CharField(max_length=10)

    class Meta:
        db_table = 'grafico_mensual'
        unique_together = ['fecha', 'rut']

    def __str__(self):
        return f"{self.rut} - {self.fecha} - Turno {self.num_turno}"


class ItinerarioEquipo(models.Model):
    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('MODIFICADO', 'Modificado'),
        ('CERRADO', 'Cerrado'),
    ]

    fecha = models.DateField()
    equipo = models.CharField(max_length=20)
    inicio = models.CharField(max_length=100, blank=True)
    servicios_am = models.TextField(blank=True)
    destino_medio = models.CharField(max_length=100, blank=True)
    servicios_pm = models.TextField(blank=True)
    destino_final = models.CharField(max_length=100, blank=True)
    destino_final_real = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PLANIFICADO')
    modificado_por = models.CharField(max_length=100, blank=True)
    ts_modificacion = models.DateTimeField(auto_now=True)
    observacion = models.TextField(blank=True)

    class Meta:
        db_table = 'itinerario_equipos'
        unique_together = ['fecha', 'equipo']

    def __str__(self):
        return f"{self.equipo} - {self.fecha}"


class RutaEstacion(models.Model):
    ruta_id = models.CharField(max_length=50)
    estacion_nombre = models.CharField(max_length=100)
    orden = models.IntegerField()

    class Meta:
        db_table = 'rutas_estaciones'
        unique_together = ['ruta_id', 'orden']

    def __str__(self):
        return f"{self.ruta_id} [{self.orden}] - {self.estacion_nombre}"


class ParejaTripulacion(models.Model):
    """Pareja fija maquinista + ayudante usada por el generador de gráfico mensual.
    Editable por jefatura (intercambiar miembros entre parejas)."""
    orden = models.IntegerField(default=0)
    maquinista = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='parejas_maquinista', to_field='rut', db_column='maquinista')
    ayudante = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='parejas_ayudante', to_field='rut', db_column='ayudante')
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'parejas_tripulacion'
        ordering = ['orden']

    def __str__(self):
        return f"Pareja {self.orden}: {self.maquinista_id} / {self.ayudante_id}"


class Feriado(models.Model):
    """Calendario de feriados → el generador usa los turnos tipo 'FER' esos días."""
    fecha = models.DateField(unique=True)
    nombre = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'feriados'
        ordering = ['fecha']

    def __str__(self):
        return f"{self.fecha} {self.nombre}".strip()


class ItinerarioMaestro(models.Model):
    tren_num = models.CharField(max_length=20)
    tipo_dia = models.CharField(max_length=10)
    ruta_id = models.CharField(max_length=50)
    estacion_nombre = models.CharField(max_length=100)
    orden_estacion = models.IntegerField()
    hora_programada = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'itinerario_maestro'
        unique_together = ['tren_num', 'tipo_dia', 'estacion_nombre']

    def __str__(self):
        return f"Tren {self.tren_num} ({self.tipo_dia}) - {self.estacion_nombre}: {self.hora_programada}"
