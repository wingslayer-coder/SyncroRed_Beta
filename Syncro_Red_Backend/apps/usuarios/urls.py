from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet, basename='usuario')
router.register(r'registros-operativos', views.RegistroOperativoViewSet, basename='registro-operativo')
router.register(r'ausencias', views.AusenciaTemporalViewSet, basename='ausencia')

urlpatterns = router.urls + [
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('recomendar-reemplazo/', views.RecomendarReemplazoView.as_view(), name='recomendar-reemplazo'),
    path('asistencia/abrir/', views.AbrirTurnoView.as_view(), name='abrir-turno'),
    path('asistencia/cerrar/', views.CerrarTurnoView.as_view(), name='cerrar-turno'),
    path('asistencia/mi-registro/', views.MiAsistenciaView.as_view(), name='mi-asistencia'),
    path('asistencia/pendientes/', views.PendientesAutorizacionView.as_view(), name='pendientes-autorizacion'),
    path('asistencia/consolidado/', views.ConsolidadoAsistenciaView.as_view(), name='consolidado'),
    path('asistencia/editar/<int:pk>/', views.EditarHorasAsistenciaView.as_view(), name='editar-horas'),
    path('asistencia/eliminar/<int:pk>/', views.EliminarRegistroAsistenciaView.as_view(), name='eliminar-asistencia'),
    path('asistencia/mi-historial/', views.MiHistorialAsistenciaView.as_view(), name='mi-historial'),
    path('asistencia/notificaciones/', views.NotificacionesAsistenciaView.as_view(), name='notificaciones'),
    path('asistencia/notificaciones/<int:pk>/leer/', views.NotificacionesAsistenciaView.as_view(), name='marcar-notificacion-leida'),
    path('asistencia/exportar-excel/', views.ExportarExcelAsistenciaView.as_view(), name='exportar-excel'),
]
