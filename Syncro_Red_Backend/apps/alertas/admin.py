from django.contrib import admin
from .models import Emergencia, Incidencia, FallaEquipo

@admin.register(Emergencia)
class EmergenciaAdmin(admin.ModelAdmin):
    list_display = ['tipo_evento', 'tren_num', 'estado_alerta', 'fecha_hora']
    list_filter = ['estado_alerta', 'fecha_hora']
    search_fields = ['tren_num', 'tipo_evento']

@admin.register(Incidencia)
class IncidenciaAdmin(admin.ModelAdmin):
    list_display = ['tipo_incidencia', 'tren_num', 'estado', 'fecha_hora']
    list_filter = ['tipo_incidencia', 'estado']

@admin.register(FallaEquipo)
class FallaEquipoAdmin(admin.ModelAdmin):
    list_display = ['sistema_afectado', 'tren_num', 'estado', 'fecha_hora']
    list_filter = ['estado']
