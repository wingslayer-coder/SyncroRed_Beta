"""Elimina la tripulación de prueba (RUT 26000xx / 27000xx) y sus datos asociados.

Borra también sus parejas en el gráfico. Por cascada se eliminan sus asignaciones
de gráfico mensual, ausencias y registros operativos. NO toca usuarios reales.

Uso:
    python manage.py eliminar_tripulacion_prueba
"""

from django.core.management.base import BaseCommand
from django.db.models import Q

from apps.usuarios.models import Usuario
from apps.operaciones.models import ParejaTripulacion


class Command(BaseCommand):
    help = 'Elimina la tripulación de prueba (RUT 26000xx / 27000xx)'

    def handle(self, *args, **options):
        filtro = Q(rut__startswith='26000') | Q(rut__startswith='27000')
        ruts = list(Usuario.objects.filter(filtro).values_list('rut', flat=True))
        if not ruts:
            self.stdout.write('No hay tripulación de prueba que eliminar.')
            return

        parejas, _ = ParejaTripulacion.objects.filter(
            Q(maquinista__in=ruts) | Q(ayudante__in=ruts)
        ).delete()
        total, _ = Usuario.objects.filter(rut__in=ruts).delete()

        self.stdout.write(self.style.SUCCESS(
            f'Eliminados {len(ruts)} usuarios de prueba y {parejas} parejas. '
            f'Total de filas borradas (con cascada): {total}.'
        ))
