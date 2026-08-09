from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

CONTENT_GROUP = "totems_content"


def notify_totem(totem_id):
    """Notify one connected totem after its persisted configuration changes."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        f"totem_{totem_id}",
        {"type": "configuracion_actualizada", "totem_id": totem_id},
    )


def notify_totems(totem_ids):
    for totem_id in set(totem_ids):
        notify_totem(totem_id)


def notify_content(resource):
    """Broadcast a public-data invalidation after a successful write."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        CONTENT_GROUP,
        {"type": "contenido_actualizado", "resource": resource},
    )
