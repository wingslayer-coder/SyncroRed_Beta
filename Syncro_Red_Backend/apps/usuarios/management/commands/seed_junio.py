"""Siembra 49 parejas de prueba (maquinista+ayudante) y genera el gráfico del mes
usando el MISMO servicio que el botón 'Generar' de la app (apps.operaciones.rostering).

Uso:
    python manage.py seed_junio
    python manage.py seed_junio --anio 2026 --mes 6

Crea/actualiza los usuarios de prueba (RUT 26.0xxxx maquinistas, 27.0xxxx ayudantes,
contraseña 'test1234'), reconstruye las 49 parejas fijas y genera el gráfico rotativo.
"""

import calendar
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.usuarios.models import Usuario
from apps.operaciones.models import ParejaTripulacion
from apps.operaciones.rostering import generar_mes

PASSWORD = 'test1234'
N = 49

NOMBRES_M = ['Andrés', 'Cristián', 'Felipe', 'Diego', 'Sebastián', 'Rodrigo', 'Matías', 'Ignacio',
             'Patricio', 'Gonzalo', 'Manuel', 'Jorge', 'Luis', 'Carlos', 'Pedro', 'Víctor', 'Mauricio',
             'Hernán', 'Marcelo', 'Fabián', 'Claudio', 'Esteban', 'Nicolás', 'Álvaro', 'Rubén', 'Hugo',
             'Daniel', 'Óscar', 'Raúl', 'Sergio', 'Gabriel', 'Iván', 'Ramón', 'Tomás', 'Cristóbal',
             'Emilio', 'Joaquín', 'Renato', 'Bastián', 'Camilo', 'Eduardo', 'Francisco', 'Gaspar',
             'Lucas', 'Maximiliano', 'Benjamín', 'Vicente', 'Agustín', 'Martín']
NOMBRES_A = ['Camila', 'Valentina', 'Francisca', 'Javiera', 'Daniela', 'Constanza', 'Antonia', 'Catalina',
             'Fernanda', 'Josefa', 'Isidora', 'Florencia', 'Trinidad', 'Emilia', 'Maite', 'Paula',
             'Carolina', 'Andrea', 'Pamela', 'Natalia', 'Karen', 'Rocío', 'Bárbara', 'Macarena',
             'Pía', 'Ignacia', 'Amanda', 'Sofía', 'Martina', 'Antonella', 'Belén', 'Monserrat',
             'Yamila', 'Tamara', 'Nicole', 'Dafne', 'Gabriela', 'Loreto', 'Romina', 'Scarlett',
             'Valeria', 'Génesis', 'Alondra', 'Renata', 'Maira', 'Krishna', 'Yasna', 'Catalina', 'Denisse']
APELLIDOS = ['Fuentes', 'Rojas', 'Muñoz', 'Carrasco', 'Vega', 'Sepúlveda', 'Navarrete', 'Sandoval',
             'Aravena', 'Riquelme', 'Herrera', 'Cáceres', 'Pizarro', 'Contreras', 'Espinoza',
             'Fuentealba', 'Lagos', 'Morales', 'Reyes', 'Tapia', 'Soto', 'Vergara', 'Cortés',
             'Bravo', 'Maldonado', 'Henríquez', 'Salazar', 'Bustamante', 'Garrido', 'Cárdenas',
             'Vidal', 'Riveros', 'Saavedra', 'Norambuena', 'Gallardo', 'Pavez', 'Inostroza',
             'Sáez', 'Acuña', 'Toro', 'Figueroa', 'Mella', 'Quezada', 'Ortega', 'Lobos',
             'Yáñez', 'Cea', 'Parra', 'Ulloa']


class Command(BaseCommand):
    help = 'Crea 49 parejas de prueba y genera el gráfico del mes con el servicio de rostering'

    def add_arguments(self, parser):
        parser.add_argument('--anio', type=int, default=2026)
        parser.add_argument('--mes', type=int, default=6)

    @transaction.atomic
    def handle(self, *args, **options):
        anio, mes = options['anio'], options['mes']

        # 1) Crear/actualizar tripulación de prueba
        maq, ay, creados = [], [], 0
        for i in range(N):
            rut_m = f'26{i + 1:06d}-{(i + 1) % 10}'
            rut_a = f'27{i + 1:06d}-{(i + 1) % 10}'
            for rut, nombre, apellido, cargo, dst in (
                (rut_m, NOMBRES_M[i % len(NOMBRES_M)], APELLIDOS[i % len(APELLIDOS)], 'MAQUINISTA', maq),
                (rut_a, NOMBRES_A[i % len(NOMBRES_A)], APELLIDOS[(i + 7) % len(APELLIDOS)], 'AYUDANTE', ay),
            ):
                u = Usuario.objects.filter(rut=rut).first()
                if not u:
                    u = Usuario.objects.create_user(rut=rut, password=PASSWORD,
                                                    nombre=nombre, apellido=apellido, cargo=cargo)
                    creados += 1
                else:
                    u.nombre, u.apellido, u.cargo = nombre, apellido, cargo
                u.is_active = True
                u.must_change_password = False
                if not u.has_usable_password():
                    u.set_password(PASSWORD)
                u.save()
                dst.append(u)

        # 2) Reconstruir las 49 parejas fijas de prueba
        ParejaTripulacion.objects.all().delete()
        ParejaTripulacion.objects.bulk_create([
            ParejaTripulacion(orden=i, maquinista=maq[i], ayudante=ay[i], activa=True)
            for i in range(N)
        ])

        # 3) Generar el gráfico con el MISMO servicio que usa la app
        rep = generar_mes(anio, mes)

        self.stdout.write(self.style.SUCCESS(
            f'Tripulación de prueba lista ({creados} usuarios creados) y '
            f'gráfico de {calendar.month_name[mes]} {anio} generado vía rostering.'
        ))
        for k in ('parejas', 'cobertura_pct', 'turnos_cubiertos', 'turnos_totales',
                  'menos_reposo', 'libres_promedio_pareja', 'max_dias_seguidos',
                  'parejas_superan_6', 'dias_sin_cobertura_total'):
            self.stdout.write(f'  {k}: {rep.get(k)}')
