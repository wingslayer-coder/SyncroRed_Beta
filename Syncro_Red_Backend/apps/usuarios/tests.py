import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.usuarios.models import Usuario


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def maquinista(db):
    u = Usuario.objects.create_user(rut='12345678-9', password='Segura123!', nombre='Juan', cargo='MAQUINISTA')
    return u


@pytest.fixture
def jefatura(db):
    u = Usuario.objects.create_user(rut='98765432-1', password='Segura123!', nombre='Pedro', cargo='IL')
    return u


@pytest.fixture
def admin_user(db):
    u = Usuario.objects.create_user(rut='11111111-1', password='Admin1234!', nombre='Admin', cargo='ADMIN', is_staff=True)
    return u


def _token(client, rut, password):
    resp = client.post(reverse('login_rut'), {'rut': rut, 'password': password}, format='json')
    return resp.data.get('access')


class TestLogin:
    def test_login_exitoso(self, client, maquinista):
        resp = client.post(reverse('login_rut'), {'rut': '12345678-9', 'password': 'Segura123!'}, format='json')
        assert resp.status_code == 200
        assert 'access' in resp.data
        assert 'refresh' in resp.data
        assert resp.data['usuario']['cargo'] == 'MAQUINISTA'

    def test_login_password_incorrecta(self, client, maquinista):
        resp = client.post(reverse('login_rut'), {'rut': '12345678-9', 'password': 'mala'}, format='json')
        assert resp.status_code == 401
        assert resp.data['error'] == 'Credenciales inválidas'

    def test_login_rut_inexistente(self, client, db):
        resp = client.post(reverse('login_rut'), {'rut': '00000000-0', 'password': 'cualquiera'}, format='json')
        assert resp.status_code == 401
        assert resp.data['error'] == 'Credenciales inválidas'

    def test_login_sin_campos(self, client, db):
        resp = client.post(reverse('login_rut'), {}, format='json')
        assert resp.status_code == 400

    def test_no_expone_rut_en_error(self, client, maquinista):
        resp = client.post(reverse('login_rut'), {'rut': '12345678-9', 'password': 'mala'}, format='json')
        assert '12345678-9' not in str(resp.data)


class TestCambioPassword:
    def test_cambio_exitoso(self, client, maquinista):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(reverse('change_password'), {'new_password': 'NuevaClave99!'}, format='json')
        assert resp.status_code == 200

    def test_minimo_8_caracteres(self, client, maquinista):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(reverse('change_password'), {'new_password': 'corta'}, format='json')
        assert resp.status_code == 400
        assert '8' in resp.data['error']

    def test_requiere_autenticacion(self, client, db):
        resp = client.post(reverse('change_password'), {'new_password': 'Segura123!'}, format='json')
        assert resp.status_code == 401


class TestPermisosPorCargo:
    def test_maquinista_no_puede_listar_usuarios(self, client, maquinista):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.get('/api/usuarios/usuarios/')
        assert resp.status_code == 403

    def test_jefatura_puede_listar_usuarios(self, client, jefatura):
        token = _token(client, '98765432-1', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.get('/api/usuarios/usuarios/')
        assert resp.status_code == 200

    def test_maquinista_solo_ve_sus_registros_operativos(self, client, maquinista, jefatura):
        token = _token(client, '12345678-9', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.get('/api/usuarios/registros-operativos/')
        assert resp.status_code == 200
        for reg in resp.data.get('results', resp.data):
            assert reg['rut_trabajador'] == '12345678-9'

    def test_reset_password_solo_admin(self, client, maquinista, jefatura):
        token = _token(client, '98765432-1', 'Segura123!')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post('/api/usuarios/usuarios/12345678-9/reset_password/')
        assert resp.status_code == 403
