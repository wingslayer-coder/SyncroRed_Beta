from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/gps/(?P<tren_num>[^/]+)/$', consumers.GpsConsumer.as_asgi()),
    re_path(r'ws/servicios/$', consumers.ServiciosConsumer.as_asgi()),
]
