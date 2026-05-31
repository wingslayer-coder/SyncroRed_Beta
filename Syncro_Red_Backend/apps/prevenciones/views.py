from rest_framework import viewsets
from .models import Prevencion, EstacionVia
from .serializers import PrevencionSerializer, EstacionViaSerializer


class PrevencionViewSet(viewsets.ModelViewSet):
    queryset = Prevencion.objects.all()
    serializer_class = PrevencionSerializer


class EstacionViaViewSet(viewsets.ModelViewSet):
    queryset = EstacionVia.objects.all()
    serializer_class = EstacionViaSerializer
