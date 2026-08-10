import json
import logging

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Totem
from .realtime import CONTENT_GROUP
from .authentication import TotemToken
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)


class TotemConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.codigo = self.scope['url_route']['kwargs']['codigo']

        try:
            totem = await sync_to_async(
                Totem.objects.filter(codigo_vinculacion=self.codigo).first
            )()
        except Exception as e:
            logger.error(f"Error al buscar tótem: {e}")
            await self.close()
            return

        if totem is None:
            logger.warning(f"Tótem con código {self.codigo} no encontrado")
            await self.close()
            return

        if totem.vinculado:
            logger.warning(f"Tótem {self.codigo} ya está vinculado")
            await self.close()
            return

        self.group_name = f'totem_{self.codigo}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def vinculado(self, event):
        await self.send(text_data=json.dumps({
            'type': 'vinculado',
            'totem_id': event['totem_id'],
            'access': event.get('access'),
        }))


class TotemConfigConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope.get('query_string', b'').decode().removeprefix('token=')
        try:
            payload = TotemToken(token).payload
            self.totem_id = payload.get('totem_id')
            self.totem = await sync_to_async(
                Totem.objects.get
            )(id=self.totem_id, vinculado=True, activo=True)
        except (TokenError, Totem.DoesNotExist, ValueError, TypeError):
            await self.close(code=4403)
            return

        self.group_name = f'totem_{self.totem_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add(CONTENT_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.channel_layer.group_discard(CONTENT_GROUP, self.channel_name)

    async def configuracion_actualizada(self, event):
        await self.send(text_data=json.dumps({
            'type': 'configuracion_actualizada',
            'totem_id': event['totem_id'],
        }))

    async def contenido_actualizado(self, event):
        await self.send(text_data=json.dumps({
            'type': 'contenido_actualizado',
            'resource': event['resource'],
        }))
