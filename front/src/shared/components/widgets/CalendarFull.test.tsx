import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import CalendarFull from "./CalendarFull";

const mockUseCalendario = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useCalendario", () => ({
  useCalendario: mockUseCalendario,
}));

describe("CalendarFull", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    cleanup();
  });

  it("muestra el título", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<CalendarFull onClose={vi.fn()} />);
    expect(screen.getByText("Calendario académico")).toBeInTheDocument();
  });

  it("muestra estado de carga", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: true,
      error: null,
    });
    render(<CalendarFull onClose={vi.fn()} />);
    expect(screen.getByText("Cargando eventos...")).toBeInTheDocument();
  });

  it("muestra error", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: "Error de conexión",
    });
    render(<CalendarFull onClose={vi.fn()} />);
    expect(screen.getByText("Error de conexión")).toBeInTheDocument();
  });

  it("muestra los 12 meses cuando carga correctamente", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<CalendarFull onClose={vi.fn()} />);
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    for (const mes of meses) {
      expect(screen.getAllByText(mes).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("muestra subtítulo 'Ciclo lectivo {año}'", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    render(<CalendarFull onClose={vi.fn()} />);
    expect(screen.getByText("Ciclo lectivo 2026")).toBeInTheDocument();
  });

  it("llama a onClose al hacer click en Cerrar", () => {
    mockUseCalendario.mockReturnValue({
      eventos: [],
      loading: false,
      error: null,
    });
    const onClose = vi.fn();
    render(<CalendarFull onClose={onClose} />);

    fireEvent.click(screen.getByText("Cerrar"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
