import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}));

vi.mock("../client", () => ({
  apiFetch: mockApiFetch,
}));

import {
  fetchPlantillas,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
  replacePlantillaWidgets,
  type PlantillaDTO,
} from "../plantillas";

const plantilla: PlantillaDTO = {
  id: 1,
  nombre: "Plantilla Principal",
  activa: true,
  widgets_posiciones: [],
  creado_en: "2026-07-31T12:00:00Z",
};

describe("plantillas API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchPlantillas llama a /api/plantillas/ y retorna datos", async () => {
    mockApiFetch.mockResolvedValue([plantilla]);
    const result = await fetchPlantillas();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/plantillas/");
    expect(result).toEqual([plantilla]);
  });

  it("createPlantilla llama a /api/plantillas/ con POST", async () => {
    mockApiFetch.mockResolvedValue(plantilla);
    const result = await createPlantilla({ nombre: "Plantilla Principal" });
    expect(mockApiFetch).toHaveBeenCalledWith("/api/plantillas/", {
      method: "POST",
      body: JSON.stringify({ nombre: "Plantilla Principal" }),
    });
    expect(result).toEqual(plantilla);
  });

  it("updatePlantilla llama a /api/plantillas/:id/ con PATCH", async () => {
    const updated = { ...plantilla, nombre: "Renombrada" };
    mockApiFetch.mockResolvedValue(updated);
    const result = await updatePlantilla(1, { nombre: "Renombrada" });
    expect(mockApiFetch).toHaveBeenCalledWith("/api/plantillas/1/", {
      method: "PATCH",
      body: JSON.stringify({ nombre: "Renombrada" }),
    });
    expect(result).toEqual(updated);
  });

  it("deletePlantilla llama a /api/plantillas/:id/ con DELETE", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    await deletePlantilla(1);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/plantillas/1/", {
      method: "DELETE",
    });
  });

  it("replacePlantillaWidgets llama a /reemplazar-widgets/ con POST", async () => {
    const resultPlantilla = {
      ...plantilla,
      widgets_posiciones: [
        {
          id: 1,
          plantilla: 1,
          widget: 2,
          widget_nombre: "Exámenes",
          widget_tipo: "examenes",
          col_pos: 0,
          fila_pos: 0,
          col_tam: 2,
          fila_tam: 2,
        },
      ],
    };
    mockApiFetch.mockResolvedValue(resultPlantilla);
    const widgets = [
      { widget: 2, col_pos: 0, fila_pos: 0, col_tam: 2, fila_tam: 2 },
    ];
    const result = await replacePlantillaWidgets(1, widgets);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/plantillas/1/reemplazar-widgets/",
      {
        method: "POST",
        body: JSON.stringify(widgets),
      },
    );
    expect(result.widgets_posiciones).toHaveLength(1);
  });
});
