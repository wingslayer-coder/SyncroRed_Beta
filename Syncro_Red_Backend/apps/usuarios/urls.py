from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet, basename='usuario')
router.register(r'registros-operativos', views.RegistroOperativoViewSet, basename='registro-operativo')
router.register(r'ausencias', views.AusenciaTemporalViewSet, basename='ausencia')

urlpatterns = router.urls
