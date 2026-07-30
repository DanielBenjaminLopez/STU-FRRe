import time
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from api.models import Noticias
from django.utils import timezone


MESES_ES = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
}


def parsear_fecha_spanish(texto):
    """Parsea '17 julio 2026' o '17 de julio de 2026' a datetime."""
    texto = texto.strip().lower()
    for separador in (' de ', ' '):
        partes = texto.split(separador)
        if len(partes) == 3:
            try:
                dia = int(partes[0])
                mes_nombre = partes[1]
                anio = int(partes[2])
                mes = MESES_ES.get(mes_nombre)
                if mes:
                    return datetime(anio, mes, dia)
            except (ValueError, KeyError):
                continue
    return None


URL = 'https://www.frre.utn.edu.ar/noticias/'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
}


def scrape_contenido_completo(enlace):
    try:
        url = enlace
        if enlace.startswith('/'):
            url = 'https://www.frre.utn.edu.ar' + enlace

        resp = requests.get(url, headers=HEADERS, verify=False, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'lxml')

        for tag in soup.select('script, style, nav, .share, .social'):
            tag.decompose()

        article = (
            soup.select_one('div.cuerpo-noticia')
            or soup.select_one('article')
            or soup.select_one('.entry-content')
            or soup.select_one('.post-content')
            or soup.select_one('.content-inner')
        )
        if article:
            texto = article.get_text(separator='\n', strip=True)
            if len(texto) > 50:
                return texto

        main = soup.select_one('main')
        if main:
            texto = main.get_text(separator='\n', strip=True)
            if len(texto) > 100:
                return texto
    except Exception:
        pass
    return None


def scrape_noticias():
    resp = requests.get(URL, headers=HEADERS, verify=False, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'lxml')
    items = soup.select('div.course-item')

    noticias = []

    for item in items:
        h3 = item.select_one('h3 a')
        if not h3:
            continue

        titulo = h3.get_text(strip=True)
        enlace = h3.get('href', '')

        p_desc = item.select_one('p.description')
        contenido_breve = p_desc.get_text(strip=True) if p_desc else ''

        p_cat = item.select_one('p.category')
        fecha_pub = None
        if p_cat:
            texto_fecha = p_cat.get_text(strip=True)
            fecha_pub = parsear_fecha_spanish(texto_fecha)

        img = item.select_one('img')
        imagen_url = ''
        if img:
            src = img.get('src', '') or img.get('data-src', '')
            if src:
                if src.startswith('/'):
                    imagen_url = 'https://www.frre.utn.edu.ar' + src
                else:
                    imagen_url = src

        noticias.append({
            'titulo': titulo,
            'contenido': contenido_breve,
            'fecha_publicacion': fecha_pub or timezone.now(),
            'fecha_expiracion': (fecha_pub or timezone.now()) + timedelta(days=365),
            'imagen_url': imagen_url,
            'enlace': enlace,
        })

    return noticias


class Command(BaseCommand):
    help = 'Scrapea noticias de frre.utn.edu.ar y las sincroniza en la BD'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra las noticias sin guardar en la BD',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        self.stdout.write('Obteniendo noticias de frre.utn.edu.ar...')

        try:
            noticias = scrape_noticias()
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error al scrapeear: {e}'))
            return

        self.stdout.write(f'Se encontraron {len(noticias)} noticias')

        if dry_run:
            for n in noticias:
                self.stdout.write(f'  - {n["titulo"]}')
            return

        self.stdout.write('Obteniendo contenido completo de cada noticia...')
        for n in noticias:
            if n['enlace']:
                contenido = scrape_contenido_completo(n['enlace'])
                if contenido:
                    n['contenido'] = contenido
                time.sleep(0.3)

        sincronizadas = 0
        for n in noticias:
            obj, created = Noticias.objects.update_or_create(
                enlace=n['enlace'],
                defaults={
                    'titulo': n['titulo'],
                    'contenido': n['contenido'],
                    'fecha_publicacion': n['fecha_publicacion'],
                    'fecha_expiracion': n['fecha_expiracion'],
                    'imagen_url': n['imagen_url'],
                    'origen': 'scraping',
                },
            )
            if created:
                sincronizadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'Sincronización completa: {sincronizadas} nuevas, '
            f'{len(noticias) - sincronizadas} actualizadas'
        ))
