from django.core.exceptions import ValidationError


def validar_video(value):
    ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
    if ext not in ('mp4', 'webm', 'mov'):
        raise ValidationError(
            'Formato no soportado. Use MP4, WebM o MOV.'
        )
    if value.size > 100 * 1024 * 1024:
        raise ValidationError(
            'El video no debe superar 100MB.'
        )
