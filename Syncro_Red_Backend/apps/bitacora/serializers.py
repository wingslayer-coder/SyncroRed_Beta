from rest_framework import serializers
from .models import ReporteFinal, NovedadOperativa

ROLES_JEFATURA = {'ADMIN', 'GERENTE', 'GERENCIA', 'IL', 'INSPECTOR DE LINEA',
                  'SL', 'SUPERVISOR DE LINEA', 'JEFE DE OPERACIONES',
                  'JEFE SERVICIO', 'JEFE DE SERVICIO'}


class ReporteFinalSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    cargo   = serializers.CharField(read_only=True)

    class Meta:
        model = ReporteFinal
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            cargo = (getattr(request.user, 'cargo', '') or '').upper()
            if cargo not in ROLES_JEFATURA:
                data.pop('reporte_detallado', None)
                data.pop('hash_detallado', None)
        return data


class NovedadOperativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NovedadOperativa
        fields = '__all__'
