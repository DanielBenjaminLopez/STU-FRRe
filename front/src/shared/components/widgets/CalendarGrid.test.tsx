import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MesGrilla, LeyendaCalendario } from "./CalendarGrid";
import type { EventoCalendario } from "../../api/calendario";

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

describe("MesGrilla", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    cleanup();
  });

  it("muestra los días de la semana como headers", () => {
    render(<MesGrilla anio={2026} mes={6} eventos={[]} />);
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
    expect(screen.getByText("V")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("renderiza los días del mes", () => {
    render(<MesGrilla anio={2026} mes={6} eventos={[]} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
  });

  it("resalta el día actual con ring", () => {
    render(<MesGrilla anio={2026} mes={6} eventos={[]} />);
    const diaHoy = screen.getByText("15");
    expect(diaHoy.className).toContain("ring-1");
    expect(diaHoy.className).toContain("ring-slate-800");
  });

  it("marca celdas fuera de mes con color atenuado", () => {
    const { container } = render(
      <MesGrilla anio={2026} mes={6} eventos={[]} />,
    );
    const celdasFueraMes = container.querySelectorAll(".text-slate-300");
    expect(celdasFueraMes.length).toBeGreaterThan(0);
  });

  it("llama a onSeleccionarEvento al clickear un día con evento", () => {
    const onSeleccionarEvento = vi.fn();
    render(
      <MesGrilla
        anio={2026}
        mes={6}
        eventos={mockEventos}
        onSeleccionarEvento={onSeleccionarEvento}
      />,
    );
    const diaConEvento = screen.getByText("9");
    fireEvent.click(diaConEvento);
    expect(onSeleccionarEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: expect.stringContaining("Independencia"),
      }),
    );
  });
});

describe("LeyendaCalendario", () => {
  beforeEach(() => {
    cleanup();
  });

  it("muestra todas las categorías cuando no se filtra", () => {
    render(<LeyendaCalendario />);
    expect(screen.getByText("Cuatrimestre")).toBeInTheDocument();
    expect(screen.getByText("Mesas de exámenes")).toBeInTheDocument();
    expect(screen.getByText("Receso invernal")).toBeInTheDocument();
    expect(screen.getByText("Feriado")).toBeInTheDocument();
    expect(screen.getByText("Otro")).toBeInTheDocument();
  });

  it("filtra categorías según los eventos proporcionados", () => {
    render(<LeyendaCalendario eventos={mockEventos} />);
    expect(screen.getByText("Mesas de exámenes")).toBeInTheDocument();
    expect(screen.getByText("Feriado")).toBeInTheDocument();
    expect(screen.queryByText("Cuatrimestre")).not.toBeInTheDocument();
    expect(screen.queryByText("Receso invernal")).not.toBeInTheDocument();
    expect(screen.queryByText("Otro")).not.toBeInTheDocument();
  });

  it("no duplica categorías con múltiples eventos del mismo tipo", () => {
    const dosFeriados: EventoCalendario[] = [
      {
        id: 9,
        titulo: "Feriado - Día de la Independencia",
        tipo: "feriado",
        formato: "puntual",
        fecha: "2026-07-09",
      },
      {
        id: 10,
        titulo: "Feriado - Día del Trabajador",
        tipo: "feriado",
        formato: "puntual",
        fecha: "2026-05-01",
      },
    ];
    const { container } = render(<LeyendaCalendario eventos={dosFeriados} />);
    const entradasFeriado = container.querySelectorAll("span");
    const labels = Array.from(entradasFeriado).filter(
      (el) => el.textContent === "Feriado",
    );
    expect(labels).toHaveLength(1);
  });
});
