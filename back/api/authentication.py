from datetime import timedelta

from django.contrib.auth.models import Group
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import Token

from .models import Totem


class TotemToken(Token):
    token_type = "totem"
    lifetime = timedelta(days=3650)

    @classmethod
    def for_totem(cls, totem):
        token = cls()
        token.payload["totem_id"] = totem.id
        return token


class TotemUser:
    def __init__(self, totem):
        self.totem = totem
        self.id = totem.id
        self.pk = totem.id
        self.is_authenticated = True
        self.is_active = totem.activo
        self.is_anonymous = False
        self.is_superuser = False

    @property
    def groups(self):
        return Group.objects.none()

    def __str__(self):
        return f"Totem #{self.id}"


class TotemAuthentication(BaseAuthentication):
    keyword = "Totem"

    def authenticate(self, request):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith(self.keyword):
            return None

        token_str = auth[len(self.keyword) + 1 :]

        try:
            token = TotemToken(token_str)
        except TokenError:
            raise AuthenticationFailed("Token inválido o expirado")

        totem_id = token.payload.get("totem_id")
        if not totem_id:
            raise AuthenticationFailed("Payload de token inválido")

        try:
            totem = Totem.objects.get(id=totem_id, vinculado=True)
        except Totem.DoesNotExist:
            raise AuthenticationFailed("Tótem no encontrado o no vinculado")

        if not totem.activo:
            raise AuthenticationFailed("Tótem desactivado")

        return (TotemUser(totem), token_str)
