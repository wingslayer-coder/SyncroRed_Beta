import json
from channels.generic.websocket import AsyncWebsocketConsumer


class GpsConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer para broadcasting de posición GPS en tiempo real.

    El cliente se conecta a ws/gps/<tren_num>/ y recibe actualizaciones
    de posición cada vez que el endpoint GPS liviano las publica.
    """

    async def connect(self):
        self.tren_num = self.scope['url_route']['kwargs']['tren_num']
        self.group_name = f'gps_tren_{self.tren_num}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def gps_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'gps_update',
            'tren_num': event['tren_num'],
            'latitud': event['latitud'],
            'longitud': event['longitud'],
            'timestamp_gps': event['timestamp_gps'],
        }))


class ServiciosConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer para broadcasting del estado general de la flota.

    El panel de escritorio se conecta a ws/servicios/ y recibe actualizaciones
    cuando cambia el estado de cualquier servicio activo.
    """

    async def connect(self):
        self.group_name = 'servicios_activos'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def servicio_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'servicio_update',
            'servicio': event['servicio'],
        }))
