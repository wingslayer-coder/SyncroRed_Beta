from rest_framework import serializers
from .models import HitoGeorreferencia


class HitoGeorreferenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HitoGeorreferencia
        fields = '__all__'
