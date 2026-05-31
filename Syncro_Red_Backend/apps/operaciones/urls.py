from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'servicios-activos', views.ServicioActivoViewSet, basename='servicio-activo')
router.register(r'servicios-historicos', views.ServicioHistoricoViewSet, basename='servicio-historico')
router.register(r'registros-estaciones', views.RegistroEstacionViewSet, basename='registro-estacion')
router.register(r'maestro-turnos', views.MaestroTurnoViewSet, basename='maestro-turno')
router.register(r'grafico-mensual', views.GraficoMensualViewSet, basename='grafico-mensual')
router.register(r'itinerario-equipos', views.ItinerarioEquipoViewSet, basename='itinerario-equipo')

urlpatterns = router.urls + [
    path('pauta-diaria/', views.PautaDiariaView.as_view(), name='pauta-diaria'),
    path('tripulacion-disponible/', views.TripulacionDisponibleView.as_view(), name='tripulacion-disponible'),
]
