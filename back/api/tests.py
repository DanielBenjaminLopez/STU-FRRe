from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.authentication import TotemToken
from api.models import Plantilla, PlantillaWidget, Totem, Widget


class WidgetModelTest(TestCase):
    def test_crear_widget(self):
        widget = Widget.objects.create(
            nombre="Horarios de Cursado",
            tipo="horarios",
            col_tam_default=4,
            fila_tam_default=2,
        )
        self.assertEqual(str(widget), "Horarios de Cursado (horarios)")
        self.assertTrue(widget.activo)


class PlantillaModelTest(TestCase):
    def test_crear_plantilla_con_widgets(self):
        plantilla = Plantilla.objects.create(nombre="Plantilla Principal")
        widget = Widget.objects.create(
            nombre="Exámenes", tipo="examenes", col_tam_default=2, fila_tam_default=2
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
            "tipo": "avisos",
            "col_tam_default": 4,
            "fila_tam_default": 2,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Widget.objects.count(), 1)

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
        widget = Widget.objects.create(nombre="Noticias", tipo="noticias")
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
            nombre="Horarios", tipo="horarios", col_tam_default=2, fila_tam_default=2
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
            "horarios",
        )

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
            nombre="Exámenes", tipo="examenes", col_tam_default=2, fila_tam_default=2
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
            nombre="Exámenes", tipo="examenes", col_tam_default=2, fila_tam_default=2
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
            nombre="Horarios", tipo="horarios", col_tam_default=2, fila_tam_default=2
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
            "horarios",
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
