from django.http import JsonResponse
from django.db import connection
from django.utils import timezone


def health_check(request):
    """Health check endpoint. Verifica DB, estado general y última actividad GPS."""
    checks = {}
    status_code = 200

    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        checks['db'] = 'ok'
    except Exception as e:
        checks['db'] = f'error: {e}'
        status_code = 503

    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        checks['redis'] = 'ok' if channel_layer is not None else 'no_configurado'
    except Exception as e:
        checks['redis'] = f'error: {e}'

    try:
        from apps.operaciones.models import ServicioActivo
        ultimo_gps = ServicioActivo.objects.exclude(
            timestamp_gps__isnull=True
        ).order_by('-timestamp_gps').values('tren_num', 'timestamp_gps').first()
        checks['ultimo_gps'] = {
            'tren_num': ultimo_gps['tren_num'],
            'timestamp': ultimo_gps['timestamp_gps'].isoformat(),
        } if ultimo_gps else None
    except Exception:
        checks['ultimo_gps'] = None

    return JsonResponse({
        'status': 'ok' if status_code == 200 else 'degraded',
        'timestamp': timezone.now().isoformat(),
        'checks': checks,
    }, status=status_code)
