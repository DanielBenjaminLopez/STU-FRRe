from rest_framework.throttling import SimpleRateThrottle


class TotemNewRateThrottle(SimpleRateThrottle):
    """
    Limita la generación de nuevos códigos de vinculación de tótems.
    Permite un máximo de 10 códigos por IP cada 10 minutos.
    """
    scope = 'totem_new'
    rate = '10/10m'

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        num, period = rate.split('/')
        num_requests = int(num)
        if period.endswith('m'):
            duration = int(period[:-1]) * 60
        elif period.endswith('s'):
            duration = int(period[:-1])
        elif period.endswith('h'):
            duration = int(period[:-1]) * 3600
        else:
            duration = {'s': 1, 'm': 60, 'h': 3600, 'd': 86400}[period[0]]
        return (num_requests, duration)

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
