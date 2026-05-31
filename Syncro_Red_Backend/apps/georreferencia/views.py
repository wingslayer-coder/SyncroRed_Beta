from rest_framework import viewsets
from .models import HitoGeorreferencia
from .serializers import HitoGeorreferenciaSerializer


class HitoGeorreferenciaViewSet(viewsets.ModelViewSet):
    queryset = HitoGeorreferencia.objects.all()
    serializer_class = HitoGeorreferenciaSerializer
