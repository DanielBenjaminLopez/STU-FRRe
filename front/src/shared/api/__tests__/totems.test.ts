import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}));

vi.mock("../client", () => ({
  apiFetch: mockApiFetch,
}));

import {
  fetchTotems,
  createTotem,
  updateTotem,
  deleteTotem,
  fetchEspacios,
  vincularTotem,
} from "../totems";

describe("totems API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchTotems llama a /api/totems/ y retorna datos", async () => {
    const mockTotems = [
      { id: 1, nombre: "Tótem A", activo: true, vinculado: true },
    ];
    mockApiFetch.mockResolvedValue(mockTotems);
    const result = await fetchTotems();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/totems/");
    expect(result).toEqual(mockTotems);
  });

  it("createTotem llama a /api/totems/new/ con POST", async () => {
    mockApiFetch.mockResolvedValue({ codigo_vinculacion: "ABC123" });
    const result = await createTotem();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/totems/new/", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(result).toEqual({ codigo_vinculacion: "ABC123" });
  });

  it("updateTotem llama a /api/totems/:id/ con PATCH", async () => {
    const updated = { id: 1, nombre: "Tótem Actualizado", activo: true, vinculado: true };
    mockApiFetch.mockResolvedValue(updated);
    const result = await updateTotem(1, { nombre: "Tótem Actualizado" });
    expect(mockApiFetch).toHaveBeenCalledWith("/api/totems/1/", {
      method: "PATCH",
      body: JSON.stringify({ nombre: "Tótem Actualizado" }),
    });
    expect(result).toEqual(updated);
  });

  it("deleteTotem llama a /api/totems/:id/ con DELETE", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    await deleteTotem(1);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/totems/1/", { method: "DELETE" });
  });

  it("fetchEspacios llama a /api/espacios/ y retorna datos", async () => {
    const espacios = [{ id: 1, nombre: "Aula 1A", tipo: "Aula", piso: 1 }];
    mockApiFetch.mockResolvedValue(espacios);
    const result = await fetchEspacios();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/espacios/");
    expect(result).toEqual(espacios);
  });

  it("vincularTotem llama a /api/totems/vincular/ con POST", async () => {
    const totem = { id: 1, nombre: "Tótem Nuevo", activo: true, vinculado: true };
    mockApiFetch.mockResolvedValue(totem);
    const data = { codigo_vinculacion: "XYZ789", nombre: "Tótem Nuevo", espacio_id: 1 };
    const result = await vincularTotem(data);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/totems/vincular/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    expect(result).toEqual(totem);
  });
});
