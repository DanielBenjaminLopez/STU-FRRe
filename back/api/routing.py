from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r'^ws/totem/(?P<codigo>\w+)/$',
        consumers.TotemConsumer.as_asgi(),
    ),
]
