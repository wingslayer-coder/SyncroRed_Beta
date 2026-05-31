from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from apps.usuarios.views import LoginRutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', LoginRutView.as_view(), name='login_rut'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/operaciones/', include('apps.operaciones.urls')),
    path('api/bitacora/', include('apps.bitacora.urls')),
    path('api/alertas/', include('apps.alertas.urls')),
    path('api/prevenciones/', include('apps.prevenciones.urls')),
    path('api/georreferencia/', include('apps.georreferencia.urls')),
]
