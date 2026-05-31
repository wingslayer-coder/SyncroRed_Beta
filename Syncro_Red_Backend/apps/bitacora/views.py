from rest_framework import viewsets, decorators
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from openpyxl import Workbook
from .models import ReporteFinal, NovedadOperativa
from .serializers import ReporteFinalSerializer, NovedadOperativaSerializer
from .filters import ReporteFinalFilter


class ReporteFinalViewSet(viewsets.ModelViewSet):
    queryset = ReporteFinal.objects.all().order_by('-creado_en')
    serializer_class = ReporteFinalSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ReporteFinalFilter

    @decorators.action(detail=False, methods=['get'])
    def exportar_excel(self, request):
        fecha = request.query_params.get('fecha')
        reportes = self.queryset
        if fecha:
            reportes = reportes.filter(fecha=fecha)

        wb = Workbook()
        ws = wb.active
        ws.title = 'Reportes'
        ws.append(['Fecha', 'Usuario', 'Cargo', 'Resumen', 'Justificación Cierre', 'Creado'])
        for rep in reportes:
            ws.append([
                rep.fecha, rep.usuario, rep.cargo,
                rep.resumen_texto[:500] if rep.resumen_texto else '',
                rep.justificacion_cierre or '',
                rep.creado_en.isoformat() if rep.creado_en else ''
            ])

        from io import BytesIO
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="reportes_{fecha or "todos"}.xlsx"'
        return response


class NovedadOperativaViewSet(viewsets.ModelViewSet):
    queryset = NovedadOperativa.objects.all().order_by('-timestamp')
    serializer_class = NovedadOperativaSerializer
