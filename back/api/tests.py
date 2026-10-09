from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth.models import Group, User
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.authentication import TotemToken
from api.models import Noticias, Plantilla, PlantillaWidget, Totem, Widget


class WidgetModelTest(TestCase):
    def test_crear_widget(self):
        widget = Widget.objects.create(
            nombre="Horarios de Cursado",
            tipo="horarios_model_test",
            col_tam_default=4,
            fila_tam_default=2,
        )
        self.assertEqual(str(widget), "Horarios de Cursado (horarios_model_test)")
        self.assertTrue(widget.activo)


class PlantillaModelTest(TestCase):
    def test_crear_plantilla_con_widgets(self):
        plantilla = Plantilla.objects.create(nombre="Plantilla Principal")
        widget = Widget.objects.create(
            nombre="Exámenes", tipo="examenes_model_test", col_tam_default=2, fila_tam_default=2
        )
        pw = PlantillaWidget.objects.create(
            plantilla=plantilla,
            widget=widget,
            col_pos=0,
            fila_pos=0,
            col_tam=2,
            fila_tam=2,
        )
        self.assertEqual(plantilla.widgets_posiciones.count(), 1)
        self.assertEqual(pw.widget.nombre, "Exámenes")


class WidgetAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="password123"
        )
        admin_group, _ = Group.objects.get_or_create(name="admin")
        self.admin_user.groups.add(admin_group)
        self.client.force_authenticate(user=self.admin_user)

    def test_crear_widget_api(self):
        url = "/api/widgets/"
        data = {
            "nombre": "Avisos Recientes",
            "tipo": "avisos_api_test",
            "col_tam_default": 4,
            "fila_tam_default": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Widget.objects.filter(tipo="avisos_api_test").count(), 1)

    def test_validacion_ancho_excedido(self):
        url = "/api/widgets/"
        data = {
            "nombre": "Widget Inválido",
            "tipo": "invalido",
            "col_tam_default": 5,  # Excede el límite de 4 columnas
            "fila_tam_default": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_proteccion_borrado_widget_en_uso(self):
        plantilla = Plantilla.objects.create(nombre="Plantilla Aulas")
        widget = Widget.objects.create(nombre="Noticias", tipo="noticias_api_test")
        PlantillaWidget.objects.create(
            plantilla=plantilla,
            widget=widget,
            col_pos=0,
            fila_pos=0,
            col_tam=4,
            fila_tam=2,
        )

        url = f"/api/widgets/{widget.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("utilizado", response.data["detail"])



class PlantillaColisionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="password123"
        )
        self.client.force_authenticate(user=self.admin_user)

        self.plantilla = Plantilla.objects.create(nombre="Plantilla Test")
        self.widget1 = Widget.objects.create(nombre="Widget 1", tipo="w1")
        self.widget2 = Widget.objects.create(nombre="Widget 2", tipo="w2")

        # Colocar widget1 en (0, 0) con 2x2
        PlantillaWidget.objects.create(
            plantilla=self.plantilla,
            widget=self.widget1,
            col_pos=0,
            fila_pos=0,
            col_tam=2,
            fila_tam=2,
        )

    def test_colision_widgets(self):
        url = "/api/plantilla-widgets/"
        # Intentar colocar widget2 en (1, 1) con 2x2 -> Debería colisionar con (0,0, 2x2)
        data = {
            "plantilla": self.plantilla.id,
            "widget": self.widget2.id,
            "col_pos": 1,
            "fila_pos": 1,
            "col_tam": 2,
            "fila_tam": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_posicion_valida_sin_colision(self):
        url = "/api/plantilla-widgets/"
        # Colocar widget2 en (2, 0) con 2x2 -> No colisiona con (0,0)
        data = {
            "plantilla": self.plantilla.id,
            "widget": self.widget2.id,
            "col_pos": 2,
            "fila_pos": 0,
            "col_tam": 2,
            "fila_tam": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_rechaza_fila_pos_negativo(self):
        url = "/api/plantilla-widgets/"
        data = {
            "plantilla": self.plantilla.id,
            "widget": self.widget2.id,
            "col_pos": 0,
            "fila_pos": -1,
            "col_tam": 2,
            "fila_tam": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rechaza_fila_pos_excedido(self):
        url = "/api/plantilla-widgets/"
        data = {
            "plantilla": self.plantilla.id,
            "widget": self.widget2.id,
            "col_pos": 0,
            "fila_pos": 6,
            "col_tam": 2,
            "fila_tam": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rechaza_fila_pos_mas_fila_tam_excede_grid(self):
        url = "/api/plantilla-widgets/"
        data = {
            "plantilla": self.plantilla.id,
            "widget": self.widget2.id,
            "col_pos": 0,
            "fila_pos": 5,
            "col_tam": 2,
            "fila_tam": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reemplazar_widgets_rechaza_fila_pos_invalida(self):
        url = f"/api/plantillas/{self.plantilla.id}/reemplazar-widgets/"
        data = [
            {
                "widget": self.widget2.id,
                "col_pos": 0,
                "fila_pos": 7,
                "col_tam": 2,
                "fila_tam": 1,
            },
        ]
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TotemModelTest(TestCase):
    def test_totem_activo_por_defecto(self):
        totem = Totem.objects.create()
        self.assertTrue(totem.activo)

    def test_totem_activo_falso(self):
        totem = Totem.objects.create(activo=False)
        self.assertFalse(totem.activo)

    def test_codigo_valido_expira_a_los_5_minutos(self):
        from datetime import timedelta
        from django.utils import timezone

        totem_expirado = Totem.objects.create(
            codigo_vinculacion="12345",
            codigo_creado_en=timezone.now() - timedelta(minutes=6),
            vinculado=False,
        )
        self.assertFalse(totem_expirado.codigo_valido)

        totem_valido = Totem.objects.create(
            codigo_vinculacion="54321",
            codigo_creado_en=timezone.now() - timedelta(minutes=4),
            vinculado=False,
        )
        self.assertTrue(totem_valido.codigo_valido)


class TotemSecurityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_rate_limiting_crear_totem(self):
        url = "/api/totems/new/"
        for _ in range(10):
            response = self.client.post(url)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response_11 = self.client.post(url)
        self.assertEqual(response_11.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class TotemAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="password123"
        )
        admin_group, _ = Group.objects.get_or_create(name="admin")
        self.admin_user.groups.add(admin_group)
        self.client.force_authenticate(user=self.admin_user)

        self.plantilla = Plantilla.objects.create(nombre="Plantilla Kiosco")
        self.widget = Widget.objects.create(
            nombre="Horarios", tipo="horarios_totem_test", col_tam_default=2, fila_tam_default=2
        )
        PlantillaWidget.objects.create(
            plantilla=self.plantilla,
            widget=self.widget,
            col_pos=0,
            fila_pos=0,
            col_tam=2,
            fila_tam=2,
        )
        self.totem = Totem.objects.create(nombre="Hall Central", plantilla=self.plantilla)

    def test_serializer_incluye_activo_y_plantilla(self):
        url = f"/api/totems/{self.totem.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["activo"])
        self.assertEqual(response.data["plantilla_id"], self.plantilla.id)
        self.assertEqual(
            response.data["plantilla"]["widgets_posiciones"][0]["widget_tipo"],
            "horarios_totem_test",
        )

    def test_listar_totems_solo_retorna_vinculados_por_defecto(self):
        self.totem.vinculado = True
        self.totem.save()
        totem_no_vinculado = Totem.objects.create(
            codigo_vinculacion="99999", vinculado=False
        )

        response = self.client.get("/api/totems/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [t["id"] for t in response.data]
        self.assertIn(self.totem.id, ids)
        self.assertNotIn(totem_no_vinculado.id, ids)

    def test_listar_totems_con_filtro_vinculado(self):
        self.totem.vinculado = True
        self.totem.save()
        totem_no_vinculado = Totem.objects.create(
            codigo_vinculacion="99998", vinculado=False
        )

        # Filtro vinculados=false
        res_no_vinc = self.client.get("/api/totems/?vinculado=false")
        ids_no_vinc = [t["id"] for t in res_no_vinc.data]
        self.assertIn(totem_no_vinculado.id, ids_no_vinc)
        self.assertNotIn(self.totem.id, ids_no_vinc)

        # Filtro vinculados=all
        res_all = self.client.get("/api/totems/?vinculado=all")
        ids_all = [t["id"] for t in res_all.data]
        self.assertIn(self.totem.id, ids_all)
        self.assertIn(totem_no_vinculado.id, ids_all)

    @patch("api.features.totems.api.notify_totem_deleted")
    def test_eliminar_totem_notifica_y_borra(self, mock_notify):
        totem_id = self.totem.id
        url = f"/api/totems/{totem_id}/"
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Totem.objects.filter(id=totem_id).exists())
        mock_notify.assert_called_once_with(totem_id)

    def test_no_se_puede_borrar_plantilla_asignada(self):
        url = f"/api/plantillas/{self.plantilla.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tótems", response.data["detail"])

    def test_se_puede_borrar_plantilla_no_asignada(self):
        libre = Plantilla.objects.create(nombre="Plantilla Libre")
        url = f"/api/plantillas/{libre.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_reemplazar_widgets(self):
        widget2 = Widget.objects.create(
            nombre="Exámenes", tipo="examenes_totem_test", col_tam_default=2, fila_tam_default=2
        )
        url = f"/api/plantillas/{self.plantilla.id}/reemplazar-widgets/"
        data = [
            {
                "widget": widget2.id,
                "col_pos": 2,
                "fila_pos": 0,
                "col_tam": 2,
                "fila_tam": 2,
            },
        ]
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plantilla.refresh_from_db()
        self.assertEqual(self.plantilla.widgets_posiciones.count(), 1)
        self.assertEqual(self.plantilla.widgets_posiciones.first().widget, widget2)

    def test_reemplazar_widgets_rechaza_solapamiento(self):
        widget2 = Widget.objects.create(
            nombre="Exámenes", tipo="examenes_totem_test", col_tam_default=2, fila_tam_default=2
        )
        url = f"/api/plantillas/{self.plantilla.id}/reemplazar-widgets/"
        data = [
            {
                "widget": self.widget.id,
                "col_pos": 0,
                "fila_pos": 0,
                "col_tam": 2,
                "fila_tam": 2,
            },
            {
                "widget": widget2.id,
                "col_pos": 1,
                "fila_pos": 1,
                "col_tam": 2,
                "fila_tam": 2,
            },
        ]
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.plantilla.refresh_from_db()
        self.assertEqual(self.plantilla.widgets_posiciones.count(), 1)


class TotemKioscoAPITestCase(TestCase):
    def setUp(self):
        self.plantilla = Plantilla.objects.create(nombre="Plantilla Kiosco")
        self.widget = Widget.objects.create(
            nombre="Horarios", tipo="horarios_kiosco_test", col_tam_default=2, fila_tam_default=2
        )
        PlantillaWidget.objects.create(
            plantilla=self.plantilla,
            widget=self.widget,
            col_pos=0,
            fila_pos=0,
            col_tam=2,
            fila_tam=2,
        )
        self.totem = Totem.objects.create(
            nombre="Hall Central", plantilla=self.plantilla, vinculado=True
        )
        self.client = APIClient()

    def _auth_totem(self, totem):
        token = TotemToken.for_totem(totem)
        self.client.credentials(HTTP_AUTHORIZATION=f"Totem {token}")

    def test_me_devuelve_config_del_totem(self):
        self._auth_totem(self.totem)
        response = self.client.get("/api/totems/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.totem.id)
        self.assertTrue(response.data["activo"])
        self.assertEqual(response.data["plantilla"]["nombre"], "Plantilla Kiosco")
        self.assertEqual(
            response.data["plantilla"]["widgets_posiciones"][0]["widget_tipo"],
            "horarios_kiosco_test",
        )

    def test_me_sin_plantilla_devuelve_null(self):
        totem_sin_plantilla = Totem.objects.create(
            nombre="Pasillo", vinculado=True
        )
        self._auth_totem(totem_sin_plantilla)
        response = self.client.get("/api/totems/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["plantilla"])

    def test_me_rechaza_totem_inactivo(self):
        self.totem.activo = False
        self.totem.save()
        self._auth_totem(self.totem)
        response = self.client.get("/api/totems/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_rechaza_usuario_admin(self):
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="password123"
        )
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/totems/me/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_token_vida_larga(self):
        from datetime import datetime, timedelta, timezone

        token = TotemToken.for_totem(self.totem)
        remaining = datetime.fromtimestamp(
            token.payload["exp"], tz=timezone.utc
        ) - token.current_time
        self.assertGreaterEqual(remaining, timedelta(days=365 * 5))

        self.client.credentials(HTTP_AUTHORIZATION=f"Totem {token}")
        response = self.client.get("/api/totems/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.totem.id)


class CsvImportAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="admin_csv", email="admin_csv@test.com", password="password123"
        )
        admin_group, _ = Group.objects.get_or_create(name="admin")
        self.admin_user.groups.add(admin_group)
        self.client.force_authenticate(user=self.admin_user)

    def test_importar_horarios_csv_sin_archivo(self):
        response = self.client.post("/api/horarios/importar-csv/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_importar_mesas_examen_csv_sin_archivo(self):
        response = self.client.post("/api/mesas-examen/importar-csv/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_importar_horarios_csv_sin_duplicados(self):
        from io import BytesIO
        from api.models import Carrera, Materia, HorarioCursado

        car = Carrera.objects.create(nombre="Sistemas Test Duplicados", tipo="grado")
        Materia.objects.create(carrera=car, nombre="Física I Test", nivel="primero")

        csv_content = "carrera,materia,comision,espacio,dia_semana,hora_inicio,hora_fin\nSistemas Test Duplicados,Física I Test,K1,Aula 10,lunes,08:00,10:00\nSistemas Test Duplicados,Física I Test,K1,Aula 10,lunes,08:00,10:00\n"
        csv_file = BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "horarios.csv"

        horarios_antes = HorarioCursado.objects.count()
        response = self.client.post("/api/horarios/importar-csv/", {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(HorarioCursado.objects.count(), horarios_antes + 1)

    def test_importar_horarios_diferente_espacio_misma_comision(self):
        from io import BytesIO
        from api.models import Carrera, Materia, HorarioCursado

        car = Carrera.objects.create(nombre="ISI Test", tipo="grado")
        Materia.objects.create(carrera=car, nombre="SGBD Test", nivel="tercero")

        csv_content = "carrera,materia,comision,espacio,dia_semana,hora_inicio,hora_fin\nISI Test,SGBD Test,Curso 1,Lab 5,martes,18:10,22:45\nISI Test,SGBD Test,Curso 1,Lab 6,martes,18:10,22:45\n"
        csv_file = BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "horarios.csv"

        horarios_antes = HorarioCursado.objects.count()
        response = self.client.post("/api/horarios/importar-csv/", {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(HorarioCursado.objects.count(), horarios_antes + 2)

    def test_importar_horarios_csv_con_errores_falla_atomicamente(self):
        from io import BytesIO
        from api.models import Carrera, Materia, HorarioCursado

        car = Carrera.objects.create(nombre="Sistemas Test Errores", tipo="grado")
        Materia.objects.create(carrera=car, nombre="Análisis Numérico Test", nivel="primero")

        csv_content = (
            "carrera,materia,comision,espacio,dia_semana,hora_inicio,hora_fin\n"
            "Sistemas Test Errores,Materia Inexistente 99,Curso 1,Aula Test Errores,Lunes,08:00,10:00\n"
            "Sistemas Test Errores,Análisis Numérico Test,,Aula Test Errores,Lunes,15:50,18:05\n"
            "Sistemas Test Errores,Análisis Numérico Test,Curso 1,Aula Test Errores,,15:50,18:05\n"
            "Sistemas Test Errores,Análisis Numérico Test,Curso 1,Aula Test Errores,Lunes,hora_invalida,18:05\n"
            ",,Curso 1,Aula Test Errores,Lunes,15:50,18:05\n"
        )
        csv_file = BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "errores_importacion.csv"

        horarios_antes = HorarioCursado.objects.count()
        response = self.client.post("/api/horarios/importar-csv/", {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertEqual(res_data["totales"]["errores"], 5)
        self.assertEqual(res_data["totales"]["creados"], 0)
        self.assertEqual(HorarioCursado.objects.count(), horarios_antes)

    def test_importar_horarios_csv_sin_espacio_exitoso(self):
        from io import BytesIO
        from api.models import Carrera, Materia, HorarioCursado

        car = Carrera.objects.create(nombre="Sistemas Test Sin Espacio", tipo="grado")
        Materia.objects.create(carrera=car, nombre="Diseño de Sistemas Test", nivel="tercero")

        csv_content = "carrera,materia,comision,espacio,dia_semana,hora_inicio,hora_fin\nSistemas Test Sin Espacio,Diseño de Sistemas Test,Curso 1,,Miércoles,15:30,17:00\n"
        csv_file = BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "horarios_sin_espacio.csv"

        horarios_antes = HorarioCursado.objects.count()
        response = self.client.post("/api/horarios/importar-csv/", {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertEqual(res_data["totales"]["creados"], 1)
        self.assertEqual(res_data["totales"]["errores"], 0)
        self.assertEqual(HorarioCursado.objects.count(), horarios_antes + 1)
        h = HorarioCursado.objects.latest("id")
        self.assertEqual(h.espacio, "")


class ScrapeNoticiasCommandTest(TestCase):
    """El scraping automatico corre con --sin-contenido y avisa a los totems."""

    ENLACE = "https://www.frre.utn.edu.ar/noticia-de-prueba/"

    def setUp(self):
        Noticias.objects.create(
            titulo="Noticia de prueba",
            contenido="Este es el cuerpo completo que ya estaba guardado.",
            fecha_publicacion=timezone.now(),
            enlace=self.ENLACE,
            origen="scraping",
        )
        self.scrapeado = [
            {
                "titulo": "Noticia de prueba actualizada",
                "contenido": "Resumen cortito del listado.",
                "fecha_publicacion": timezone.now(),
                "fecha_expiracion": timezone.now() + timedelta(days=365),
                "imagen_url": "https://www.frre.utn.edu.ar/img.jpg",
                "enlace": self.ENLACE,
            }
        ]

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_sin_contenido_conserva_el_cuerpo_guardado(self, mock_scrape):
        mock_scrape.return_value = self.scrapeado

        call_command("scrape_noticias", "--sin-contenido")

        noticia = Noticias.objects.get(enlace=self.ENLACE)
        self.assertEqual(
            noticia.contenido,
            "Este es el cuerpo completo que ya estaba guardado.",
        )
        # el resto de los campos si se refresca
        self.assertEqual(noticia.titulo, "Noticia de prueba actualizada")

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_sin_el_flag_el_cuerpo_si_se_actualiza(self, mock_scrape):
        mock_scrape.return_value = self.scrapeado

        with patch(
            "api.management.commands.scrape_noticias.scrape_contenido_completo",
            return_value="Cuerpo descargado del sitio.",
        ):
            call_command("scrape_noticias")

        noticia = Noticias.objects.get(enlace=self.ENLACE)
        self.assertEqual(noticia.contenido, "Cuerpo descargado del sitio.")

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_notifica_a_los_totems(self, mock_scrape):
        mock_scrape.return_value = self.scrapeado

        # on_commit difiere el callback hasta el commit, y TestCase corre dentro
        # de una transaccion que se hace rollback: hay que ejecutarlo a mano.
        with patch("api.management.commands.scrape_noticias.notify_content") as mock_notify:
            with self.captureOnCommitCallbacks(execute=True):
                call_command("scrape_noticias", "--sin-contenido")

        mock_notify.assert_called_once_with("noticias")

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_noticia_nueva_igual_recibe_el_resumen(self, mock_scrape):
        nuevo = dict(self.scrapeado[0])
        nuevo["enlace"] = "https://www.frre.utn.edu.ar/noticia-nueva/"
        mock_scrape.return_value = [nuevo]

        call_command("scrape_noticias", "--sin-contenido")

        noticia = Noticias.objects.get(enlace=nuevo["enlace"])
        # con --sin-contenido no se pisa el contenido, pero una noticia recién
        # creada no puede quedar vacía, así que toma el resumen del listado
        self.assertEqual(noticia.contenido, "Resumen cortito del listado.")

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_rellena_noticia_que_habia_quedado_vacia(self, mock_scrape):
        noticia = Noticias.objects.get(enlace=self.ENLACE)
        noticia.contenido = ""
        noticia.save(update_fields=["contenido"])
        mock_scrape.return_value = self.scrapeado

        call_command("scrape_noticias", "--sin-contenido")

        noticia.refresh_from_db()
        self.assertEqual(noticia.contenido, "Resumen cortito del listado.")

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_falla_con_codigo_de_salida_distinto_de_cero(self, mock_scrape):
        """El job diario depende del exit code: si no falla, no queda registro."""
        mock_scrape.side_effect = Exception("timeout del sitio")

        with self.assertRaises(CommandError):
            call_command("scrape_noticias", "--sin-contenido")


class NoticiasSyncAPITest(TestCase):
    """El boton de sincronizar descarga el cuerpo completo y no lo pisa."""

    ENLACE = "https://www.frre.utn.edu.ar/noticia-del-boton/"

    def setUp(self):
        self.scrapeado = [
            {
                "titulo": "Noticia del boton",
                "contenido": "Resumen cortito del listado.",
                "fecha_publicacion": timezone.now(),
                "fecha_expiracion": timezone.now() + timedelta(days=365),
                "imagen_url": "https://www.frre.utn.edu.ar/img.jpg",
                "enlace": self.ENLACE,
            }
        ]
        self.client = APIClient()

    @patch("api.management.commands.scrape_noticias.scrape_contenido_completo")
    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_guarda_el_cuerpo_completo_y_no_el_resumen(self, mock_scrape, mock_completo):
        mock_scrape.return_value = self.scrapeado
        mock_completo.return_value = "El articulo completo de la noticia, con mucho mas detalle."

        response = self.client.post("/api/noticias/sync/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        noticia = Noticias.objects.get(enlace=self.ENLACE)
        self.assertEqual(
            noticia.contenido,
            "El articulo completo de la noticia, con mucho mas detalle.",
        )
        # el cuerpo completo tiene que haberse descargado de verdad
        mock_completo.assert_called_once_with(self.ENLACE)

    @patch("api.management.commands.scrape_noticias.scrape_contenido_completo")
    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_actualiza_una_noticia_existente_con_el_cuerpo_nuevo(self, mock_scrape, mock_completo):
        Noticias.objects.create(
            titulo="Vieja",
            contenido="Cuerpo viejo que debe ser reemplazado por el nuevo.",
            fecha_publicacion=timezone.now(),
            enlace=self.ENLACE,
            origen="scraping",
        )
        mock_scrape.return_value = self.scrapeado
        mock_completo.return_value = "Cuerpo nuevo descargado del sitio."

        response = self.client.post("/api/noticias/sync/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        noticia = Noticias.objects.get(enlace=self.ENLACE)
        self.assertEqual(noticia.contenido, "Cuerpo nuevo descargado del sitio.")
        self.assertEqual(response.json()["nuevas"], 0)
        self.assertEqual(response.json()["actualizadas"], 1)

    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_devuelve_502_si_el_scrape_falla(self, mock_scrape):
        mock_scrape.side_effect = Exception("timeout del sitio")

        response = self.client.post("/api/noticias/sync/")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("timeout del sitio", response.json()["detail"])

    @patch("api.management.commands.scrape_noticias.scrape_contenido_completo")
    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_responde_el_mismo_shape_que_espera_el_panel(self, mock_scrape, mock_completo):
        mock_scrape.return_value = self.scrapeado
        mock_completo.return_value = "Cuerpo."

        data = self.client.post("/api/noticias/sync/").json()

        # estas claves son las que lee syncNoticias en el frontend
        self.assertEqual(
            set(data), {"detail", "nuevas", "actualizadas", "total"}
        )
        self.assertEqual(data["total"], 1)

    @patch("api.management.commands.scrape_noticias.scrape_contenido_completo")
    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_avisa_a_los_totems(self, mock_scrape, mock_completo):
        mock_scrape.return_value = self.scrapeado
        mock_completo.return_value = "Cuerpo."

        # la vista importa notify_content a nivel de modulo, hay que parchearlo ahi
        with patch("api.views.notify_content") as mock_notify:
            with self.captureOnCommitCallbacks(execute=True):
                self.client.post("/api/noticias/sync/")

        mock_notify.assert_called_once_with("noticias")

    @patch("api.management.commands.scrape_noticias.scrape_contenido_completo")
    @patch("api.management.commands.scrape_noticias.scrape_noticias")
    def test_el_endpoint_es_publico_mientras_siga_allowany(self, mock_scrape, mock_completo):
        """Documenta que sync sigue con AllowAny, pendiente de cerrar."""
        mock_scrape.return_value = self.scrapeado
        mock_completo.return_value = "Cuerpo."

        anonimo = APIClient()
        response = anonimo.post("/api/noticias/sync/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MateriaSimplificadaTestCase(TestCase):
    """Cubre la unificación de Materia y la simplificación de HorarioCursado."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="admin_sin_cuatrimestre",
            email="admin_sin_cuatrimestre@test.com",
            password="password123",
        )
        admin_group, _ = Group.objects.get_or_create(name="admin")
        self.admin_user.groups.add(admin_group)
        self.client.force_authenticate(user=self.admin_user)

    def test_model_materia_no_tiene_cuatrimestre_modalidad_ni_plan_estudio(self):
        from api.models import Materia, HorarioCursado, MesaExamen

        campos_mat = {f.name for f in Materia._meta.get_fields()}
        self.assertNotIn("cuatrimestre", campos_mat)
        self.assertNotIn("modalidad", campos_mat)
        self.assertNotIn("plan_estudio", campos_mat)
        self.assertIn("nivel", campos_mat)
        self.assertIn("carrera", campos_mat)

        campos_hor = {f.name for f in HorarioCursado._meta.get_fields()}
        self.assertNotIn("plan_estudio", campos_hor)
        self.assertNotIn("activo", campos_hor)
        self.assertIn("materia", campos_hor)
        self.assertIn("comision", campos_hor)

        campos_mesa = {f.name for f in MesaExamen._meta.get_fields()}
        self.assertNotIn("turno", campos_mesa)
        self.assertNotIn("activo", campos_mesa)
        self.assertNotIn("plan_estudio", campos_mesa)
        self.assertNotIn("plan_materia", campos_mesa)
        self.assertIn("carrera", campos_mesa)
        self.assertIn("materia", campos_mesa)
        self.assertIn("espacio", campos_mesa)
        self.assertIn("fecha", campos_mesa)
        self.assertIn("hora", campos_mesa)
        self.assertIsNone(MesaExamen._meta.get_field("materia").related_model)

    def test_api_materias_expone_carrera_y_nivel_sin_plan_estudio(self):
        from api.models import Carrera, Materia

        car = Carrera.objects.create(nombre="Test API Sin Cuatrimestre", tipo="grado", codigo="TAC")
        mat = Materia.objects.create(
            carrera=car,
            nombre="Materia Test API Sin Cuatrimestre",
            nivel="primero",
        )

        response = self.client.get("/api/materias/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        fila = next(f for f in response.json() if f["nombre"] == mat.nombre)
        self.assertNotIn("cuatrimestre", fila)
        self.assertNotIn("modalidad", fila)
        self.assertNotIn("plan_estudio", fila)
        self.assertEqual(fila["nivel"], "primero")
        self.assertEqual(fila["carrera"], car.id)

    def test_api_horarios_con_comision_string_sin_activo_ni_plan_estudio(self):
        from api.models import Carrera, HorarioCursado, Materia

        car = Carrera.objects.create(nombre="Test API Horarios", tipo="grado", codigo="TAH")
        mat = Materia.objects.create(carrera=car, nombre="Materia Test API Horarios", nivel="cuarto")
        HorarioCursado.objects.create(
            materia=mat,
            comision="Curso 1",
            dia_semana="lunes",
            hora_inicio="08:00",
            hora_fin="10:00",
        )

        response = self.client.get("/api/horarios/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        fila = next(
            f for f in response.json() if f["materia_nombre"] == mat.nombre
        )
        self.assertNotIn("cuatrimestre", fila)
        self.assertNotIn("modalidad", fila)
        self.assertNotIn("plan_estudio", fila)
        self.assertNotIn("activo", fila)
        self.assertEqual(fila["nivel"], "cuarto")
        self.assertEqual(fila["comision"], "Curso 1")

    def test_api_mesas_examen_sin_turno_activo_ni_plan_estudio(self):
        from io import BytesIO
        from api.models import Carrera, MesaExamen

        car = Carrera.objects.create(nombre="Test API Mesas", tipo="grado", codigo="TAM")
        MesaExamen.objects.create(
            carrera=car,
            materia="Materia Libre no existente en tabla Materia",
            espacio="",
            fecha="2026-12-10",
            hora="08:00",
        )

        response = self.client.get("/api/mesas-examen/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        fila = next(
            f for f in response.json() if f["materia"] == "Materia Libre no existente en tabla Materia"
        )
        self.assertNotIn("turno", fila)
        self.assertNotIn("llamado", fila)
        self.assertNotIn("activo", fila)
        self.assertNotIn("plan_estudio", fila)
        self.assertEqual(fila["carrera_codigo"], "TAM")
        self.assertEqual(fila["espacio"], "")
        self.assertEqual(fila["fecha"], "2026-12-10")

        csv_content = "carrera,materia,espacio,fecha,hora\nTAM,Materia CSV Libre,,15/12/2026,14:00\n"
        csv_file = BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "mesas.csv"
        res_csv = self.client.post("/api/mesas-examen/importar-csv/", {"file": csv_file}, format="multipart")
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertTrue(res_csv.json()["exito"])
        self.assertTrue(MesaExamen.objects.filter(carrera=car, materia="Materia CSV Libre", espacio="").exists())

    def test_importar_materia_csv_ignora_columnas_eliminadas(self):
        import tablib
        from api.models import Carrera, Materia
        from api.resources import MateriaResource

        car = Carrera.objects.create(nombre="Carrera Test CSV", tipo="grado", codigo="TCSV")

        dataset = tablib.Dataset()
        dataset.headers = (
            "carrera",
            "materia",
            "nivel",
            "modalidad",
            "cuatrimestre",
            "plan_estudio",
        )
        dataset.append(("Carrera Test CSV", "Materia Test CSV", "primero", "anual", "segundo", "2023"))
        dataset.append(("Carrera Test CSV", "Materia Test CSV 2", "segundo", "cuatrimestral", "primero", "2023"))

        antes = Materia.objects.count()
        result = MateriaResource().import_data(dataset, dry_run=False)
        self.assertFalse(result.has_errors(), result.row_errors())
        self.assertEqual(Materia.objects.count(), antes + 2)

        m1 = Materia.objects.get(carrera=car, nombre="Materia Test CSV")
        self.assertEqual(m1.nivel, "primero")


class AvisosActivosAPITestCase(TestCase):
    def test_avisos_activos_es_publico(self):
        from django.utils import timezone
        from rest_framework import status
        from api.models import Aviso

        hoy = timezone.now().date()
        Aviso.objects.create(
            fecha=hoy,
            motivo="Paro docente",
            tipo="paro",
        )

        res = self.client.get("/api/avisos-activos/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["motivo"], "Paro docente")

