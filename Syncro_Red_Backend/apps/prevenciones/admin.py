from django.contrib import admin
from .models import Prevencion, EstacionVia

@admin.register(Prevencion)
class PrevencionAdmin(admin.ModelAdmin):
    list_display = ['tramo_desde', 'tramo_hasta', 'fecha_emision', 'velocidad_restriccion']
    list_filter = ['seccion']

@admin.register(EstacionVia)
class EstacionViaAdmin(admin.ModelAdmin):
    list_display = ['etiqueta', 'estacion', 'via', 'posicion']
    search_fields = ['etiqueta', 'estacion']
