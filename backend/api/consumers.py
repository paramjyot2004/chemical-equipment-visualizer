
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DataUpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'equipment_updates'
        # Join the equipment updates group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def data_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': 'data_updated'
        }))
