from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'emergencias', views.EmergenciaViewSet, basename='emergencia')
router.register(r'incidencias', views.IncidenciaViewSet, basename='incidencia')
router.register(r'fallas-equipo', views.FallaEquipoViewSet, basename='falla-equipo')

urlpatterns = router.urls
