import { apiFetch } from "./client";

export interface WidgetPosicionDTO {
  id: number;
  plantilla: number;
  widget: number;
  widget_nombre: string;
  widget_tipo: string;
  col_pos: number;
  fila_pos: number;
  col_tam: number;
  fila_tam: number;
}

export interface PlantillaDTO {
  id: number;
  nombre: string;
  activa: boolean;
  widgets_posiciones: WidgetPosicionDTO[];
  creado_en: string;
}

export interface WidgetPosicionInput {
  widget: number;
  col_pos: number;
  fila_pos: number;
  col_tam: number;
  fila_tam: number;
}

export async function fetchPlantillas(): Promise<PlantillaDTO[]> {
  return apiFetch<PlantillaDTO[]>("/api/plantillas/");
}

export async function createPlantilla(data: {
  nombre: string;
  activa?: boolean;
}): Promise<PlantillaDTO> {
  return apiFetch<PlantillaDTO>("/api/plantillas/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePlantilla(
  id: number,
  data: Partial<PlantillaDTO>,
): Promise<PlantillaDTO> {
  return apiFetch<PlantillaDTO>(`/api/plantillas/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePlantilla(id: number): Promise<void> {
  await apiFetch(`/api/plantillas/${id}/`, { method: "DELETE" });
}

export async function replacePlantillaWidgets(
  id: number,
  widgets: WidgetPosicionInput[],
): Promise<PlantillaDTO> {
  return apiFetch<PlantillaDTO>(`/api/plantillas/${id}/reemplazar-widgets/`, {
    method: "POST",
    body: JSON.stringify(widgets),
  });
}
