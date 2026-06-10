import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.utils import timezone
from apps.usuarios.models import Usuario
from apps.operaciones.models import ServicioActivo, RegistroEstacion, GraficoMensual, MaestroTurno


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def maquinista(db):
    return Usuario.objects.create_user(rut='12345678-9', password='Segura123!', nombre='Juan', cargo='MAQUINISTA')


@pytest.fixture
def servicio_activo(db, maquinista):
    return ServicioActivo.objects.create(
        fecha=timezone.now().date(),
        tren_num='T01',
        equipo_id='EQ01',
        maquinista='Juan',
        rut_maquinista='12345678-9',
        estado='ACTIVO',
    )


def _token(client, rut, password):
    resp = client.post(reverse('login_rut'), {'rut': rut, 'password': password}, format='json')
    return resp.data.get('access')


class TestGpsUpdate:
    def test_actualiza_posicion(self, client, maquinista, servicio_activo):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.patch(
            f'/api/operaciones/servicios-activos/{servicio_activo.id}/gps/',
            {'latitud': -33.45, 'longitud': -70.66},
            format='json',
        )
        assert resp.status_code == 200
        assert resp.data['ok'] is True
        servicio_activo.refresh_from_db()
        assert servicio_activo.latitud == -33.45
        assert servicio_activo.longitud == -70.66
        assert servicio_activo.timestamp_gps is not None

    def test_requiere_latitud_longitud(self, client, maquinista, servicio_activo):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.patch(
            f'/api/operaciones/servicios-activos/{servicio_activo.id}/gps/',
            {'latitud': -33.45},
            format='json',
        )
        assert resp.status_code == 400

    def test_servicio_inexistente_retorna_404(self, client, maquinista):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.patch(
            '/api/operaciones/servicios-activos/99999/gps/',
            {'latitud': -33.45, 'longitud': -70.66},
            format='json',
        )
        assert resp.status_code == 404

    def test_requiere_autenticacion(self, client, servicio_activo):
        resp = client.patch(
            f'/api/operaciones/servicios-activos/{servicio_activo.id}/gps/',
            {'latitud': -33.45, 'longitud': -70.66},
            format='json',
        )
        assert resp.status_code == 401


class TestSyncBulk:
    def test_sync_registro_estacion(self, client, maquinista, servicio_activo):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        fecha = str(timezone.now().date())
        resp = client.post(
            '/api/operaciones/sync/bulk/',
            {
                'operaciones': [
                    {
                        'tipo': 'registro_estacion',
                        'timestamp_dispositivo': f'{fecha}T10:00:00',
                        'datos': {
                            'fecha': fecha,
                            'tren_num': 'T01',
                            'estacion_id': 'EST_CENTRAL',
                            'estado': 'A LA HORA',
                        },
                    }
                ]
            },
            format='json',
        )
        assert resp.status_code == 200
        assert resp.data['ok'] == 1
        assert resp.data['errores'] == 0
        assert RegistroEstacion.objects.filter(tren_num='T01', estacion_id='EST_CENTRAL').exists()

    def test_sync_gps(self, client, maquinista, servicio_activo):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        fecha = str(timezone.now().date())
        resp = client.post(
            '/api/operaciones/sync/bulk/',
            {
                'operaciones': [
                    {
                        'tipo': 'gps',
                        'timestamp_dispositivo': f'{fecha}T10:05:00',
                        'datos': {
                            'servicio_id': servicio_activo.id,
                            'latitud': -33.5,
                            'longitud': -70.7,
                        },
                    }
                ]
            },
            format='json',
        )
        assert resp.status_code == 200
        assert resp.data['ok'] == 1
        servicio_activo.refresh_from_db()
        assert servicio_activo.latitud == -33.5

    def test_sync_procesado_en_orden_cronologico(self, client, maquinista, servicio_activo):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        fecha = str(timezone.now().date())
        resp = client.post(
            '/api/operaciones/sync/bulk/',
            {
                'operaciones': [
                    {
                        'tipo': 'registro_estacion',
                        'timestamp_dispositivo': f'{fecha}T11:00:00',
                        'datos': {'fecha': fecha, 'tren_num': 'T01', 'estacion_id': 'STOP_B', 'estado': 'ATRASO'},
                    },
                    {
                        'tipo': 'registro_estacion',
                        'timestamp_dispositivo': f'{fecha}T10:00:00',
                        'datos': {'fecha': fecha, 'tren_num': 'T01', 'estacion_id': 'STOP_B', 'estado': 'A LA HORA'},
                    },
                ]
            },
            format='json',
        )
        assert resp.status_code == 200
        reg = RegistroEstacion.objects.get(tren_num='T01', estacion_id='STOP_B')
        assert reg.estado == 'ATRASO'

    def test_error_parcial_no_bloquea_resto(self, client, maquinista, servicio_activo):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        fecha = str(timezone.now().date())
        resp = client.post(
            '/api/operaciones/sync/bulk/',
            {
                'operaciones': [
                    {
                        'tipo': 'tipo_invalido',
                        'timestamp_dispositivo': f'{fecha}T09:00:00',
                        'datos': {},
                    },
                    {
                        'tipo': 'registro_estacion',
                        'timestamp_dispositivo': f'{fecha}T09:01:00',
                        'datos': {'fecha': fecha, 'tren_num': 'T01', 'estacion_id': 'STOP_C', 'estado': 'A LA HORA'},
                    },
                ]
            },
            format='json',
        )
        assert resp.status_code == 200
        assert resp.data['errores'] == 1
        assert resp.data['ok'] == 1

    def test_requiere_autenticacion(self, client, db):
        resp = client.post('/api/operaciones/sync/bulk/', {'operaciones': []}, format='json')
        assert resp.status_code == 401
