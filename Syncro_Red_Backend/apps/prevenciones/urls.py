from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'prevenciones', views.PrevencionViewSet, basename='prevencion')
router.register(r'estaciones-vias', views.EstacionViaViewSet, basename='estacion-via')

urlpatterns = router.urls
