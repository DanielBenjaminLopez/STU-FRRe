import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import WidgetPalette from "../WidgetPalette";
import { WIDGET_REGISTRY } from "../../pages/plantillas/types";

const MockHorarios = () => <div data-testid="widget-horarios">Horarios mock</div>;
const MockExamenes = () => <div data-testid="widget-examenes">Examenes mock</div>;

const mockComponents = {
  horarios: MockHorarios,
  examenes: MockExamenes,
};

vi.mock("@dnd-kit/core", () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}));

describe("WidgetPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título del panel", () => {
    render(<WidgetPalette widgets={Object.values(WIDGET_REGISTRY)} components={mockComponents} />);
    expect(screen.getByText("Agregar elementos")).toBeInTheDocument();
  });

  it("renderiza los dos widgets del registry", () => {
    render(<WidgetPalette widgets={Object.values(WIDGET_REGISTRY)} components={mockComponents} />);
    expect(screen.getByTestId("widget-horarios")).toBeInTheDocument();
    expect(screen.getByTestId("widget-examenes")).toBeInTheDocument();
  });

  it("muestra el tamaño de cada widget", () => {
    render(<WidgetPalette widgets={Object.values(WIDGET_REGISTRY)} components={mockComponents} />);
    const sizes = screen.getAllByText(/4×2/);
    expect(sizes.length).toBe(2);
  });

  it("renderiza los componentes de preview de cada widget", () => {
    render(<WidgetPalette widgets={Object.values(WIDGET_REGISTRY)} components={mockComponents} />);
    expect(screen.getByTestId("widget-horarios")).toBeInTheDocument();
    expect(screen.getByTestId("widget-examenes")).toBeInTheDocument();
  });
});
