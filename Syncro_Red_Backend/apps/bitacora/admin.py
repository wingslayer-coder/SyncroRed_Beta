from django.contrib import admin
from .models import ReporteFinal, NovedadOperativa

class NovedadInline(admin.TabularInline):
    model = NovedadOperativa
    extra = 0

@admin.register(ReporteFinal)
class ReporteFinalAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'fecha', 'cargo', 'creado_en']
    list_filter = ['fecha', 'cargo']
    inlines = [NovedadInline]

@admin.register(NovedadOperativa)
class NovedadOperativaAdmin(admin.ModelAdmin):
    list_display = ['reporte', 'tren_num', 'estacion', 'tipo', 'minutos', 'categoria']
    list_filter = ['categoria', 'tipo']
