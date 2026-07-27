from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Plantilla, PlantillaWidget, Widget


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
