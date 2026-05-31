import django_filters
from .models import ReporteFinal


class ReporteFinalFilter(django_filters.FilterSet):
    fecha = django_filters.DateFilter(field_name='fecha')
    fecha_gte = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_lte = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')
    usuario = django_filters.CharFilter(field_name='usuario', lookup_expr='icontains')
    cargo = django_filters.CharFilter(field_name='cargo', lookup_expr='icontains')

    class Meta:
        model = ReporteFinal
        fields = ['fecha', 'usuario', 'cargo']
