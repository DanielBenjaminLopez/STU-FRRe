import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAvisos } from "../useAvisos";
import { fetchAvisosActivos, type Aviso } from "../../api/avisos";
import { useTotemRealtime } from "../../context/TotemRealtimeContext";

vi.mock("../../api/avisos", () => ({
  fetchAvisosActivos: vi.fn(),
}));

vi.mock("../../context/TotemRealtimeContext", () => ({
  useTotemRealtime: vi.fn(),
}));

const mockFetch = vi.mocked(fetchAvisosActivos);
const mockRealtime = vi.mocked(useTotemRealtime);

function makeAviso(overrides: Partial<Aviso> = {}): Aviso {
  return {
    id: 1,
    horario_cursado: null,
    actividad_extra: null,
    fecha: "2026-03-15",
    motivo: "Manifestacion",
    tipo: "paro",
    ...overrides,
  };
}

describe("useAvisos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRealtime.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("empieza cargando y no es visible hasta que resuelve", async () => {
    let resolve: (value: Aviso[]) => void = () => {};
    mockFetch.mockReturnValue(
      new Promise<Aviso[]>((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useAvisos());

    expect(result.current.loading).toBe(true);
    expect(result.current.visible).toBe(false);

    resolve([makeAviso()]);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.avisos).toHaveLength(1);
    expect(result.current.visible).toBe(true);
  });

  it("no es visible si la lista viene vacía", async () => {
    mockFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useAvisos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(false);
    expect(result.current.visible).toBe(false);
  });

  it("marca error y se mantiene oculto si el fetch falla", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAvisos());
    await waitFor(() => expect(result.current.error).toBe(true));

    expect(result.current.avisos).toEqual([]);
    expect(result.current.visible).toBe(false);
  });

  it("vuelve a pedir los avisos cuando llega un evento realtime de avisos", async () => {
    mockFetch.mockResolvedValue([makeAviso()]);

    const { rerender } = renderHook(() => useAvisos());
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockRealtime.mockReturnValue({
      type: "contenido_actualizado",
      resource: "avisos",
    });
    rerender();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it("ignora eventos realtime de otros recursos", async () => {
    mockFetch.mockResolvedValue([makeAviso()]);

    const { rerender } = renderHook(() => useAvisos());
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockRealtime.mockReturnValue({
      type: "contenido_actualizado",
      resource: "noticias",
    });
    rerender();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("refresca los avisos cada 5 minutos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockResolvedValue([makeAviso()]);

    const { result } = renderHook(() => useAvisos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60_000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
