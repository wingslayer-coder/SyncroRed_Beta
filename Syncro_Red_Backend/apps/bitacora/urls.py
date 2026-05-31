from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reportes-finales', views.ReporteFinalViewSet, basename='reporte-final')
router.register(r'novedades', views.NovedadOperativaViewSet, basename='novedad')

urlpatterns = router.urls
