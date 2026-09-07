import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import UbicacionesMapaPage from "../UbicacionesMapaPage";

const {
  mockTotems,
  mockSelectedTotem,
  mockRefreshTotems,
  mockFetchUbicaciones,
  mockUpdateUbicacion,
  mockUpdateTotemPinMapa,
  mockSileo,
} = vi.hoisted(() => ({
  mockTotems: vi.fn(),
  mockSelectedTotem: vi.fn(),
  mockRefreshTotems: vi.fn(),
  mockFetchUbicaciones: vi.fn(),
  mockUpdateUbicacion: vi.fn(),
  mockUpdateTotemPinMapa: vi.fn(),
  mockSileo: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sileo", () => ({
  sileo: mockSileo,
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: mockTotems(),
    selectedTotem: mockSelectedTotem(),
    refreshTotems: mockRefreshTotems,
  }),
}));

vi.mock("../../../shared/api/ubicacionesMapa", () => ({
  fetchUbicacionesMapa: mockFetchUbicaciones,
  updateUbicacionMapa: mockUpdateUbicacion,
}));

vi.mock("../../../shared/api/totems", () => ({
  updateTotemPinMapa: mockUpdateTotemPinMapa,
}));

vi.mock("../../../shared/components/widgets/MapaRaw", () => ({
  default: ({
    onPinPlaced,
  }: {
    onPinPlaced?: (pos: { floor: string; svgX: number; svgY: number }) => void;
  }) => (
    <div data-testid="mock-mapa-raw">
      <button
        data-testid="btn-place-pin"
        onClick={() => onPinPlaced?.({ floor: "baja", svgX: 150, svgY: 250 })}
      >
        Place Pin
      </button>
    </div>
  ),
}));

const mockUbicacionesData = [
  {
    id: 1,
    svg_id: "aula_1",
    piso: "baja",
    nombre: "Aula Magna",
    tipo: "aula",
    tipo_display: "Aula",
  },
  {
    id: 2,
    svg_id: "lab_1",
    piso: "primero",
    nombre: "Laboratorio de Redes",
    tipo: "laboratorio",
    tipo_display: "Laboratorio",
  },
];

const mockTotemWithPin = {
  id: "totem-1",
  nombre: "Tótem Entrada",
  vinculado: true,
  pin_mapa_piso: "baja",
  pin_mapa_svg_x: 100,
  pin_mapa_svg_y: 200,
};

describe("UbicacionesMapaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUbicaciones.mockResolvedValue(mockUbicacionesData);
    mockTotems.mockReturnValue([mockTotemWithPin]);
    mockSelectedTotem.mockReturnValue(mockTotemWithPin);
    mockRefreshTotems.mockResolvedValue(undefined);
    mockUpdateTotemPinMapa.mockResolvedValue({});
    mockUpdateUbicacion.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and displays ubicaciones for the active floor", async () => {
    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(screen.getByText("Aula Magna")).toBeInTheDocument();
      expect(screen.getByText("aula_1")).toBeInTheDocument();
    });

    expect(mockFetchUbicaciones).toHaveBeenCalled();
  });

  it("shows sileo.error when loading ubicaciones fails", async () => {
    mockFetchUbicaciones.mockRejectedValue(new Error("Network failure"));

    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al cargar las ubicaciones",
          description: "Network failure",
        }),
      );
    });
  });

  it("edits an ubicacion silently without toast", async () => {
    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(screen.getByText("Aula Magna")).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText("Editar ubicación");
    fireEvent.click(editButton);

    expect(screen.getByText("Editar — aula_1")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateUbicacion).toHaveBeenCalledWith(1, {
        nombre: "Aula Magna",
        tipo: "aula",
      });
    });

    // Silent update: no success toast
    expect(mockSileo.success).not.toHaveBeenCalled();
  });

  it("updates totem pin silently on placement", async () => {
    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-mapa-raw")).toBeInTheDocument();
    });

    const placeBtn = screen.getByTestId("btn-place-pin");
    fireEvent.click(placeBtn);

    await waitFor(() => {
      expect(mockUpdateTotemPinMapa).toHaveBeenCalledWith("totem-1", {
        pin_mapa_piso: "baja",
        pin_mapa_svg_x: 150,
        pin_mapa_svg_y: 250,
      });
      expect(mockRefreshTotems).toHaveBeenCalled();
    });

    // Placement should be silent
    expect(mockSileo.success).not.toHaveBeenCalled();
  });

  it("shows sileo.error when updating totem pin fails", async () => {
    mockUpdateTotemPinMapa.mockRejectedValue(new Error("Save failed"));

    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(screen.getByTestId("btn-place-pin")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-place-pin"));

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al guardar la posición",
          description: "Save failed",
        }),
      );
    });
  });

  it("clears totem pin and shows sileo.success toast", async () => {
    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Limpiar pin" }),
      ).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole("button", { name: "Limpiar pin" });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(mockUpdateTotemPinMapa).toHaveBeenCalledWith("totem-1", null);
      expect(mockRefreshTotems).toHaveBeenCalled();
      expect(mockSileo.success).toHaveBeenCalledWith({
        title: "Posición eliminada",
      });
    });
  });

  it("shows sileo.error when clearing totem pin fails", async () => {
    mockUpdateTotemPinMapa.mockRejectedValue(new Error("Clear failed"));

    render(<UbicacionesMapaPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Limpiar pin" }),
      ).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole("button", { name: "Limpiar pin" });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al limpiar la posición",
          description: "Clear failed",
        }),
      );
    });
  });
});
