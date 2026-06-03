"""Asigna turnos aleatorios en el gráfico mensual a la tripulación de prueba.

Uso:
    python manage.py seed_grafico_prueba                 # hoy + 6 días (1 semana)
    python manage.py seed_grafico_prueba --dias 14
    python manage.py seed_grafico_prueba --desde 2026-06-10 --dias 7

Cada día, cada trabajador de prueba recibe un turno válido al azar (con horario
real en MaestroTurno) o, con ~20% de probabilidad, día libre ('L'). Así las
pruebas de recomendación muestran una mezcla de candidatos libres y con sobretiempo.
Solo afecta a los RUT de prueba (prefijos 26.0xx y 27.0xx); no toca datos reales.
"""

import datetime
import random

from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario
from apps.operaciones.models import GraficoMensual, MaestroTurno
from apps.usuarios.recomendacion import tipo_dia
from .seed_tripulacion_prueba import MAQUINISTAS, AYUDANTES

PROB_LIBRE = 0.20


class Command(BaseCommand):
    help = 'Asigna turnos aleatorios (gráfico mensual) a la tripulación de prueba'

    def add_arguments(self, parser):
        parser.add_argument('--desde', type=str, default=None, help='Fecha inicial YYYY-MM-DD (default: hoy)')
        parser.add_argument('--dias', type=int, default=7, help='Cantidad de días a generar (default: 7)')
        parser.add_argument('--seed', type=int, default=None, help='Semilla aleatoria para reproducibilidad')

    def handle(self, *args, **options):
        if options['seed'] is not None:
            random.seed(options['seed'])

        desde = (datetime.date.fromisoformat(options['desde'])
                 if options['desde'] else datetime.date.today())
        dias = max(1, options['dias'])

        ruts = [m[0] for m in MAQUINISTAS] + [a[0] for a in AYUDANTES]
        trabajadores = list(Usuario.objects.filter(rut__in=ruts))
        if not trabajadores:
            self.stdout.write(self.style.ERROR(
                'No hay tripulación de prueba. Ejecuta primero: manage.py seed_tripulacion_prueba'))
            return

        # Turnos válidos (con horario) por tipo de día — cacheados
        turnos_por_tipo = {}
        for td in ('LV', 'SAB', 'DOM'):
            turnos_por_tipo[td] = [
                m.num_turno.strip()
                for m in MaestroTurno.objects.filter(tipo_dia=td)
                if (m.presentacion_hora or '').strip() not in ('', '---')
                and (m.cierre_hora or '').strip() not in ('', '---')
            ]

        total = 0
        libres = 0
        for i in range(dias):
            d = desde + datetime.timedelta(days=i)
            td = tipo_dia(d)
            opciones = turnos_por_tipo.get(td) or []
            for u in trabajadores:
                if not opciones or random.random() < PROB_LIBRE:
                    num = 'L'
                    libres += 1
                else:
                    num = random.choice(opciones)
                GraficoMensual.objects.update_or_create(
                    fecha=d, rut=u, defaults={'num_turno': num}
                )
                total += 1

        self.stdout.write(self.style.SUCCESS(
            f'Gráfico de prueba listo: {total} asignaciones '
            f'({desde} a {desde + datetime.timedelta(days=dias - 1)}, {len(trabajadores)} trabajadores). '
            f'{libres} días libres.'
        ))
