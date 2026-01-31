
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Fixed: Changed from .as_remote_wrapper() to .as_asgi()
    re_path(r'ws/updates/$', consumers.DataUpdateConsumer.as_asgi()),
]
