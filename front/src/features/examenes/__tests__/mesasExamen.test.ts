import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchMesasExamen,
  createMesaExamen,
  updateMesaExamen,
  deleteMesaExamen,
} from "../api/mesasExamen";
import { apiFetch } from "../../../shared/api/client";

vi.mock("../../../shared/api/client", () => ({
  apiFetch: vi.fn(),
  apiUpload: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe("mesasExamen API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchMesasExamen consulta /api/mesas-examen/", async () => {
    mockApiFetch.mockResolvedValueOnce([]);
    const res = await fetchMesasExamen();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/mesas-examen/");
    expect(res).toEqual([]);
  });

  it("createMesaExamen envía POST con materia string y sin turno ni activo", async () => {
    const payload = {
      carrera: 1,
      materia: "Algoritmos y Estructuras de Datos",
      espacio: "Aula 10",
      fecha: "2026-12-10",
      hora: "08:00",
    };
    mockApiFetch.mockResolvedValueOnce({ id: 5, ...payload });
    await createMesaExamen(payload);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/mesas-examen/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updateMesaExamen y deleteMesaExamen llaman al endpoint con id", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: 5 });
    await updateMesaExamen(5, { espacio: "Aula 12" });
    expect(mockApiFetch).toHaveBeenCalledWith("/api/mesas-examen/5/", {
      method: "PATCH",
      body: JSON.stringify({ espacio: "Aula 12" }),
    });

    mockApiFetch.mockResolvedValueOnce(undefined);
    await deleteMesaExamen(5);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/mesas-examen/5/", {
      method: "DELETE",
    });
  });
});
