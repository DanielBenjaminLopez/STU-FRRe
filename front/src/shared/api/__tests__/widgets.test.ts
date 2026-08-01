import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "../client";
import { fetchWidgets } from "../widgets";

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe("fetchWidgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("llama a GET /api/widgets/", async () => {
    mockApiFetch.mockResolvedValue([]);
    await fetchWidgets();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/widgets/");
  });

  it("devuelve la lista de widgets", async () => {
    const widgets = [
      {
        id: 1,
        nombre: "Horarios",
        tipo: "horarios",
        col_tam_default: 4,
        fila_tam_default: 2,
        activo: true,
        creado_en: "2026-01-01T00:00:00Z",
      },
    ];
    mockApiFetch.mockResolvedValue(widgets);
    const result = await fetchWidgets();
    expect(result).toEqual(widgets);
  });
});
