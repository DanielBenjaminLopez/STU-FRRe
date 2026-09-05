import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import Home from "../Home";
import { fetchTotemMe } from "../../../shared/api/totems";
import { ApiError } from "../../../shared/api/client";
import type { Totem } from "../../../shared/api/totems";

vi.mock("../../../shared/api/totems", () => ({
  fetchTotemMe: vi.fn(),
}));

const mockFetchTotemMe = vi.mocked(fetchTotemMe);

const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/components/widgets/Horarios", () => ({
  default: () => <div data-testid="mock-horarios">Horarios widget</div>,
}));

vi.mock("../../../shared/components/widgets/Examenes", () => ({
  default: () => <div data-testid="mock-examenes">Examenes widget</div>,
}));

vi.mock("../../../shared/components/widgets/Calendar", () => ({
  default: () => <div data-testid="mock-calendario">Calendario widget</div>,
}));

vi.mock("../../../shared/components/widgets/Mapa", () => ({
  default: () => <div data-testid="mock-mapa">Mapa widget</div>,
}));

vi.mock("../../../shared/components/widgets/Encabezado", () => ({
  default: () => <div data-testid="mock-encabezado">Encabezado</div>,
}));

vi.mock("../../../shared/hooks/useTotemScale", () => ({
  useTotemScale: () => ({
    containerRef: { current: null },
    scale: 1,
  }),
  TOTEM_WIDTH: 1080,
  TOTEM_HEIGHT: 1920,
}));

function makeTotem(overrides: Partial<Totem> = {}): Totem {
  return {
    id: 1,
    nombre: "Tótem 1",
    espacio_id: null,
    espacio_nombre: null,
    activo: true,
    config_pantalla: {},
    vinculado: true,
    plantilla_id: null,
    plantilla: null,
    pin_mapa_piso: null,
    pin_mapa_svg_x: null,
    pin_mapa_svg_y: null,
    creado_en: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("totem Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("auth_token", "totem-token");
  });

  afterEach(() => {
    cleanup();
  });

  it("redirige a /onboarding si no hay token", async () => {
    localStorage.clear();
    render(<Home />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding", {
        replace: true,
      });
    });
  });

  it("renderiza los widgets de la plantilla del tótem", async () => {
    mockFetchTotemMe.mockResolvedValue(
      makeTotem({
        plantilla_id: 1,
        plantilla: {
          id: 1,
          nombre: "Plantilla por defecto",
          activa: false,
          creado_en: "2026-01-01T00:00:00Z",
          widgets_posiciones: [
            {
              id: 11,
              plantilla: 1,
              widget: 1,
              widget_nombre: "Horarios",
              widget_tipo: "horarios",
              col_pos: 0,
              fila_pos: 0,
              col_tam: 4,
              fila_tam: 2,
            },
          ],
        },
      }),
    );
    render(<Home />);
    await screen.findByTestId("mock-horarios");
    await waitFor(() => {
      expect(screen.queryByTestId("mock-calendario")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("mock-encabezado")).toBeInTheDocument();
  });

  it("muestra el placeholder Próximamente cuando el tótem no tiene plantilla", async () => {
    mockFetchTotemMe.mockResolvedValue(makeTotem());
    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText(/Próximamente encontrarás aquí/),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("mock-horarios")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-examenes")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-calendario")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-mapa")).not.toBeInTheDocument();
  });

  it("muestra la pantalla de standby cuando el tótem está desactivado", async () => {
    mockFetchTotemMe.mockRejectedValue(new Error("Tótem desactivado"));
    render(<Home />);
    expect(
      await screen.findByText("Tótem fuera de servicio"),
    ).toBeInTheDocument();
  });

  it("redirige a /onboarding cuando recibe 403", async () => {
    mockFetchTotemMe.mockRejectedValue(new ApiError("Forbidden", 403));
    render(<Home />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding", {
        replace: true,
      });
    });
  });
});
