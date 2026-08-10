from django.apps import AppConfig
from django.db.models.signals import post_migrate


def seed_grupos(sender, **kwargs):
    from django.contrib.auth.models import Group, Permission

    admin, _ = Group.objects.get_or_create(name='admin')
    secretaria, _ = Group.objects.get_or_create(name='secretaria')
    totem, _ = Group.objects.get_or_create(name='totem')

    admin.permissions.set(Permission.objects.all())

    api_perms = Permission.objects.filter(content_type__app_label='api')
    secretaria.permissions.set(api_perms)
    totem.permissions.set(api_perms.filter(codename__startswith='view_'))


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        post_migrate.connect(seed_grupos, sender=self)
