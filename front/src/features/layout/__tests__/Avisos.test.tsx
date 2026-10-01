import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Avisos from "../components/Avisos";
import type { Aviso } from "../api/avisos";

class MockResizeObserver {
  cb: ResizeObserverCallback;

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

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

describe("widget Avisos", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renderiza el encabezado y el contenido de cada aviso", () => {
    render(
      <Avisos
        avisos={[
          makeAviso({ id: 1 }),
          makeAviso({ id: 2, motivo: "Corte de luz", tipo: "feriado" }),
        ]}
      />,
    );

    expect(screen.getByText("Avisos")).toBeInTheDocument();
    expect(screen.getByText("Manifestacion")).toBeInTheDocument();
    expect(screen.getByText("Paro:")).toBeInTheDocument();
    expect(screen.getByText("Corte de luz")).toBeInTheDocument();
    expect(screen.getByText("Feriado:")).toBeInTheDocument();
  });

  it("formatea la fecha en formato es-AR", () => {
    render(<Avisos avisos={[makeAviso({ fecha: "2026-03-15" })]} />);
    expect(screen.getByText("15/03/2026")).toBeInTheDocument();
  });

  it("usa el tipo crudo cuando no está en el mapa de labels", () => {
    render(<Avisos avisos={[makeAviso({ tipo: "misterioso" })]} />);
    expect(screen.getByText("misterioso:")).toBeInTheDocument();
  });

  it("no se posiciona en absoluto ni usa márgenes negativos", () => {
    const { container } = render(<Avisos avisos={[makeAviso()]} />);
    const root = container.firstElementChild as HTMLElement;
    const classes = root.className.split(" ");

    expect(classes).not.toContain("absolute");
    expect(classes.filter((c) => c.startsWith("-m"))).toEqual([]);
  });

  it("no aplica la clase de marquee cuando el contenido no desborda", () => {
    const { container } = render(<Avisos avisos={[makeAviso()]} />);
    const track = container.querySelector(".avisos-marquee") as HTMLElement;

    expect(track).toBeInTheDocument();
    expect(track.className).not.toContain("avisos-marquee-overflowing");
  });
});
