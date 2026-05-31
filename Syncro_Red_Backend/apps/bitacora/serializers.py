from rest_framework import serializers
from .models import ReporteFinal, NovedadOperativa


class ReporteFinalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteFinal
        fields = '__all__'


class NovedadOperativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NovedadOperativa
        fields = '__all__'
