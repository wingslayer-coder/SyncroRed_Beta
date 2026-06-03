"""Importa/corrige el Maestro de Turnos desde un CSV (fuente de verdad).

CSV (separador ';'):
  num_turno;tipo_dia;apertura_lugar;apertura_hora;presentacion_lugar;presentacion_hora;servicios;cierre_lugar;cierre_hora

- Normaliza las horas a HH:MM con cero inicial ('3:25' -> '03:25'); '-' -> ''.
- Limpia espacios en lugares y servicios.
- Hace upsert por (num_turno, tipo_dia) y elimina los turnos de la BD que ya no
  están en el CSV (solo dentro de los tipo_dia presentes en el CSV).

Uso:
    python manage.py importar_turnos --archivo "C:\\Users\\Benja\\Desktop\\turnos.csv"
    python manage.py importar_turnos --archivo turnos.csv --no-reconciliar
"""

import csv
import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.operaciones.models import MaestroTurno

DEFAULT_PATH = r'C:\Users\Benja\Desktop\turnos.csv'
CAMPOS = ['num_turno', 'tipo_dia', 'apertura_lugar', 'apertura_hora',
          'presentacion_lugar', 'presentacion_hora', 'servicios', 'cierre_lugar', 'cierre_hora']


def _norm_hora(s):
    s = (s or '').strip()
    if not s or s == '-':
        return ''
    if ':' not in s:
        return s
    h, m = s.split(':', 1)
    return f'{h.strip().zfill(2)}:{m.strip().zfill(2)}'


def _norm_txt(s):
    s = (s or '').strip()
    return '' if s == '-' else s


class Command(BaseCommand):
    help = 'Importa/corrige el Maestro de Turnos desde un CSV'

    def add_arguments(self, parser):
        parser.add_argument('--archivo', type=str, default=DEFAULT_PATH)
        parser.add_argument('--no-reconciliar', action='store_true',
                            help='No eliminar turnos de la BD que falten en el CSV')

    @transaction.atomic
    def handle(self, *args, **options):
        path = options['archivo']
        if not os.path.exists(path):
            raise CommandError(f'No existe el archivo: {path}')

        # Lectura tolerante a codificación
        contenido = None
        for enc in ('utf-8-sig', 'utf-8', 'latin-1'):
            try:
                with open(path, encoding=enc) as fh:
                    contenido = fh.read()
                break
            except UnicodeDecodeError:
                continue
        if contenido is None:
            raise CommandError('No se pudo decodificar el CSV')

        reader = csv.DictReader(contenido.splitlines(), delimiter=';')
        faltan = [c for c in CAMPOS if c not in (reader.fieldnames or [])]
        if faltan:
            raise CommandError(f'El CSV no tiene las columnas esperadas. Faltan: {faltan}')

        creados = actualizados = 0
        claves_csv = set()
        tipos_csv = set()

        for fila in reader:
            num = (fila['num_turno'] or '').strip()
            tipo = (fila['tipo_dia'] or '').strip().upper()
            if not num or not tipo:
                continue
            claves_csv.add((num, tipo))
            tipos_csv.add(tipo)

            defaults = {
                'apertura_lugar': _norm_txt(fila['apertura_lugar']),
                'apertura_hora': _norm_hora(fila['apertura_hora']),
                'presentacion_lugar': _norm_txt(fila['presentacion_lugar']),
                'presentacion_hora': _norm_hora(fila['presentacion_hora']),
                'servicios': _norm_txt(fila['servicios']),
                'cierre_lugar': _norm_txt(fila['cierre_lugar']),
                'cierre_hora': _norm_hora(fila['cierre_hora']),
            }
            _, was_created = MaestroTurno.objects.update_or_create(
                num_turno=num, tipo_dia=tipo, defaults=defaults
            )
            creados += was_created
            actualizados += (not was_created)

        eliminados = 0
        if not options['no_reconciliar']:
            for mt in MaestroTurno.objects.filter(tipo_dia__in=tipos_csv):
                if (mt.num_turno.strip(), mt.tipo_dia.strip().upper()) not in claves_csv:
                    mt.delete()
                    eliminados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Maestro de Turnos importado desde {os.path.basename(path)}: '
            f'{creados} creados, {actualizados} actualizados, {eliminados} eliminados (obsoletos). '
            f'Tipos en CSV: {sorted(tipos_csv)}'
        ))
