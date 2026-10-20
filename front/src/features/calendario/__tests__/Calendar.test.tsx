import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Calendar from "../components/Calendar";
import type { EventoCalendario } from "../api/calendario";

const mockUseCalendario = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useCalendario", () => ({
  useCalendario: mockUseCalendario,
}));

vi.mock("../components/CalendarFull", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="calendar-full">
      <span>Calendario académico</span>
      <button type="button" onClick={onClose}>
        Cerrar
      </button>
    </div>
  ),
}));

const mockEventos: EventoCalendario[] = [
  {
    id: 5,
    titulo: "Mesas de exámenes - Julio 2026",
    tipo: "mesa_examen",
    formato: "rango",
    desde: "2026-07-06",
    hasta: "2026-07-24",
  },
  {
    id: 9,
    titulo: "Feriado - Día de la Independencia",
    tipo: "feriado",
    formato: "puntual",
    fecha: "2026-07-09",
  },
];

describe("Calendar", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el título y subtítulo", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<Calendar />);
    expect(screen.getByText("Calendario")).toBeInTheDocument();
    expect(screen.getByText("Julio 2026")).toBeInTheDocument();
  });

  it("muestra estado de carga", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: true,
      error: null,
    });
    render(<Calendar />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("muestra error", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: "Error al cargar el calendario",
    });
    render(<Calendar />);
    expect(
      screen.getByText("Error al cargar el calendario"),
    ).toBeInTheDocument();
  });

  it("muestra los días de la semana de la grilla", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<Calendar />);
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
    expect(screen.getByText("V")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("muestra la leyenda del mes con los eventos filtrados", () => {
    mockUseCalendario.mockReturnValue({
      eventos: mockEventos,
      loading: false,
      error: null,
    });
    render(<Calendar />);
    expect(screen.getByText("Mesas de exámenes")).toBeInTheDocument();
    expect(screen.getByText("Feriado")).toBeInTheDocument();
  });

  it("muestra el botón 'Abrir calendario'", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<Calendar />);
    expect(screen.getByText("Abrir calendario")).toBeInTheDocument();
  });

  it("abre la vista completa al hacer click en 'Abrir calendario'", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<Calendar />);

    expect(screen.queryByTestId("calendar-full")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Abrir calendario"));

    expect(screen.getByTestId("calendar-full")).toBeInTheDocument();
  });

  it("renderiza la variante 2x1 con título y botón a la izquierda y el calendario pequeño a la derecha", () => {
    mockUseCalendario.mockReturnValue({
      eventos: mockEventos,
      loading: false,
      error: null,
    });
    render(<Calendar colSpan={2} rowSpan={1} />);
    const widget = screen.getByTestId("calendario-widget");
    expect(widget).toHaveAttribute("data-variant", "2x1");
    expect(widget).toHaveClass("col-span-2", "row-span-1", "flex-row");
    expect(screen.getByText("Calendario")).toBeInTheDocument();
    expect(screen.getByText("Abrir calendario")).toBeInTheDocument();
    expect(
      screen.getByTestId("calendario-preview-container"),
    ).toBeInTheDocument();
    expect(screen.getByText("Julio 2026")).toBeInTheDocument();
  });

  it("renderiza la variante 1x1 mostrando solo la fecha de hoy junto al botón sin título", () => {
    mockUseCalendario.mockReturnValue({
      eventos: mockEventos,
      loading: false,
      error: null,
    });
    render(<Calendar colSpan={1} rowSpan={1} />);
    const widget = screen.getByTestId("calendario-widget");
    expect(widget).toHaveAttribute("data-variant", "1x1");
    expect(widget).toHaveClass("col-span-1", "row-span-1");
    expect(screen.queryByText("Calendario")).not.toBeInTheDocument();
    expect(screen.getByText("Abrir calendario")).toBeInTheDocument();
    expect(screen.getByTestId("calendario-hoy-card")).toBeInTheDocument();
    expect(screen.getByTestId("calendario-dia-hoy")).toHaveTextContent("15");
    expect(screen.getByText("Miércoles")).toBeInTheDocument();
    expect(screen.getByText("Julio 2026")).toBeInTheDocument();
    expect(
      screen.queryByTestId("calendario-preview-container"),
    ).not.toBeInTheDocument();
  });
});
