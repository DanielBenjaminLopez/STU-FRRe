import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import WidgetPalette from "../WidgetPalette";
import { WIDGET_REGISTRY } from "../../pages/plantillas/types";

vi.mock("@dnd-kit/core", () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}));

function MockHorarios() {
  return <div data-testid="mock-horarios">Horarios</div>;
}
function MockExamenes() {
  return <div data-testid="mock-examenes">Exámenes</div>;
}
function MockCalendario() {
  return <div data-testid="mock-calendario">Calendario</div>;
}
function MockMapa() {
  return <div data-testid="mock-mapa">Mapa</div>;
}
function MockNoticias() {
  return <div data-testid="mock-noticias">Noticias</div>;
}

const mockComponents = {
  horarios: MockHorarios,
  examenes: MockExamenes,
  calendario: MockCalendario,
  mapa: MockMapa,
  noticias: MockNoticias,
};

describe("WidgetPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título del panel", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );
    expect(screen.getByText("Agregar elementos")).toBeInTheDocument();
  });

  it("renderiza los widgets del registry", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );
    expect(screen.getByText("Horarios")).toBeInTheDocument();
    expect(screen.getByText("Exámenes")).toBeInTheDocument();
    expect(screen.getByText("Calendario")).toBeInTheDocument();
    expect(screen.getByText("Mapa")).toBeInTheDocument();
    expect(screen.getByText("Noticias")).toBeInTheDocument();
  });

  it("muestra el tamaño de cada widget", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );
    expect(screen.getAllByText(/4×2/)).toHaveLength(3);
    expect(screen.getAllByText(/2×2/)).toHaveLength(2);
  });

  it("renderiza los componentes reales dentro de cada card", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );
    expect(screen.getByTestId("mock-horarios")).toBeInTheDocument();
    expect(screen.getByTestId("mock-examenes")).toBeInTheDocument();
    expect(screen.getByTestId("mock-calendario")).toBeInTheDocument();
    expect(screen.getByTestId("mock-mapa")).toBeInTheDocument();
    expect(screen.getByTestId("mock-noticias")).toBeInTheDocument();
  });
});
