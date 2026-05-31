from rest_framework import serializers
from .models import Prevencion, EstacionVia


class PrevencionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prevencion
        fields = '__all__'


class EstacionViaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstacionVia
        fields = '__all__'
