from django.contrib import admin
from .models import ServicioActivo, ServicioHistorico, RegistroEstacion, MaestroTurno, GraficoMensual, ItinerarioEquipo

@admin.register(ServicioActivo)
class ServicioActivoAdmin(admin.ModelAdmin):
    list_display = ['tren_num', 'equipo_id', 'fecha', 'estado', 'maquinista']
    list_filter = ['estado', 'fecha']
    search_fields = ['tren_num', 'equipo_id']

@admin.register(ServicioHistorico)
class ServicioHistoricoAdmin(admin.ModelAdmin):
    list_display = ['tren_num', 'fecha', 'estado']

@admin.register(RegistroEstacion)
class RegistroEstacionAdmin(admin.ModelAdmin):
    list_display = ['tren_num', 'estacion_id', 'estado', 'timestamp']
    list_filter = ['estado', 'fecha']

@admin.register(MaestroTurno)
class MaestroTurnoAdmin(admin.ModelAdmin):
    list_display = ['num_turno', 'tipo_dia', 'apertura_lugar', 'cierre_lugar']

@admin.register(GraficoMensual)
class GraficoMensualAdmin(admin.ModelAdmin):
    list_display = ['rut', 'fecha', 'num_turno']

@admin.register(ItinerarioEquipo)
class ItinerarioEquipoAdmin(admin.ModelAdmin):
    list_display = ['equipo', 'fecha', 'estado', 'destino_final']
    list_filter = ['estado']
