from rest_framework import serializers
from .models import Emergencia, Incidencia, FallaEquipo


class EmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emergencia
        fields = '__all__'
        read_only_fields = ['fecha_hora']


class IncidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incidencia
        fields = '__all__'
        read_only_fields = ['fecha_hora']


class FallaEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FallaEquipo
        fields = '__all__'
        read_only_fields = ['fecha_hora']
