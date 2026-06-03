"""Siembra tripulación de prueba: 10 maquinistas y 10 ayudantes.

Uso:
    python manage.py seed_tripulacion_prueba
    python manage.py seed_tripulacion_prueba --reset   # borra los de prueba y los recrea

Todos usan la contraseña 'test1234' y quedan activos. Los RUT de prueba usan
los prefijos 26.0xx (maquinistas) y 27.0xx (ayudantes) para no chocar con datos reales.
"""

from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario

PASSWORD = 'test1234'

MAQUINISTAS = [
    ('26000001-1', 'Andrés', 'Fuentes'),
    ('26000002-2', 'Cristián', 'Rojas'),
    ('26000003-3', 'Felipe', 'Muñoz'),
    ('26000004-4', 'Diego', 'Carrasco'),
    ('26000005-5', 'Sebastián', 'Vega'),
    ('26000006-6', 'Rodrigo', 'Sepúlveda'),
    ('26000007-7', 'Matías', 'Navarrete'),
    ('26000008-8', 'Ignacio', 'Sandoval'),
    ('26000009-9', 'Patricio', 'Aravena'),
    ('26000010-0', 'Gonzalo', 'Riquelme'),
]

AYUDANTES = [
    ('27000001-1', 'Camila', 'Herrera'),
    ('27000002-2', 'Valentina', 'Cáceres'),
    ('27000003-3', 'Francisca', 'Pizarro'),
    ('27000004-4', 'Javiera', 'Contreras'),
    ('27000005-5', 'Daniela', 'Espinoza'),
    ('27000006-6', 'Constanza', 'Fuentealba'),
    ('27000007-7', 'Antonia', 'Lagos'),
    ('27000008-8', 'Catalina', 'Morales'),
    ('27000009-9', 'Fernanda', 'Reyes'),
    ('27000010-0', 'Josefa', 'Tapia'),
]


class Command(BaseCommand):
    help = 'Crea 10 maquinistas y 10 ayudantes de prueba (contraseña: test1234)'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true',
                            help='Elimina la tripulación de prueba existente antes de recrearla')

    def handle(self, *args, **options):
        datos = [(*m, 'MAQUINISTA') for m in MAQUINISTAS] + [(*a, 'AYUDANTE') for a in AYUDANTES]
        ruts = [d[0] for d in datos]

        if options['reset']:
            borrados, _ = Usuario.objects.filter(rut__in=ruts).delete()
            self.stdout.write(f'  Reset: {borrados} registros eliminados')

        creados, actualizados = 0, 0
        for rut, nombre, apellido, cargo in datos:
            user = Usuario.objects.filter(rut=rut).first()
            if user:
                user.nombre, user.apellido, user.cargo = nombre, apellido, cargo
                user.is_active = True
                user.must_change_password = False
                user.set_password(PASSWORD)
                user.save()
                actualizados += 1
            else:
                u = Usuario.objects.create_user(
                    rut=rut, password=PASSWORD,
                    nombre=nombre, apellido=apellido, cargo=cargo,
                )
                u.must_change_password = False
                u.save()
                creados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Tripulación de prueba lista: {creados} creados, {actualizados} actualizados '
            f'(10 maquinistas + 10 ayudantes). Contraseña: {PASSWORD}'
        ))
