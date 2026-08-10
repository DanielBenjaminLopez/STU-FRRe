import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import TemplateCanvas from "../TemplateCanvas";
import type { WidgetPlacement } from "../../pages/plantillas/types";
import { WIDGET_REGISTRY } from "../../pages/plantillas/types";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}));

vi.mock("../../../shared/components/widgets/Encabezado", () => ({
  default: () => <div data-testid="mock-encabezado">Encabezado</div>,
}));

vi.mock("../../../shared/components/widgets/Horarios", () => ({
  default: () => <div data-testid="mock-horarios">Horarios widget</div>,
}));

vi.mock("../../../shared/components/widgets/Examenes", () => ({
  default: () => <div data-testid="mock-examenes">Examenes widget</div>,
}));

vi.mock("../../../shared/hooks/useTotemScale", () => ({
  useTotemScale: () => ({
    containerRef: { current: null },
    scale: 1,
  }),
  TOTEM_WIDTH: 1080,
  TOTEM_HEIGHT: 1920,
}));

const mockWidgets: WidgetPlacement[] = [
  { id: "w1", type: "horarios", col: 0, row: 0, colSpan: 4, rowSpan: 2 },
];

describe("TemplateCanvas", () => {
  const defaultProps = {
    widgets: [] as WidgetPlacement[],
    nombre: "Test Plantilla",
    onNombreChange: vi.fn(),
    onRemoveWidget: vi.fn(),
    hoverCell: null,
    activeType: null,
    registry: WIDGET_REGISTRY,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el input del nombre de plantilla", () => {
    render(<TemplateCanvas {...defaultProps} />);
    expect(screen.getByDisplayValue("Test Plantilla")).toBeInTheDocument();
  });

  it("llama a onNombreChange al editar el nombre", () => {
    const onNombreChange = vi.fn();
    render(
      <TemplateCanvas {...defaultProps} onNombreChange={onNombreChange} />,
    );
    const input = screen.getByDisplayValue("Test Plantilla");
    fireEvent.change(input, { target: { value: "Nuevo nombre" } });
    expect(onNombreChange).toHaveBeenCalledWith("Nuevo nombre");
  });

  it("renderiza el encabezado del totem", () => {
    render(<TemplateCanvas {...defaultProps} />);
    expect(screen.getByTestId("mock-encabezado")).toBeInTheDocument();
  });

  it("renderiza widgets colocados con su componente real", () => {
    render(<TemplateCanvas {...defaultProps} widgets={mockWidgets} />);
    expect(screen.getByTestId("mock-horarios")).toBeInTheDocument();
  });

  it("renderiza el botón de quitar widget", () => {
    render(<TemplateCanvas {...defaultProps} widgets={mockWidgets} />);
    expect(screen.getByTitle("Quitar widget")).toBeInTheDocument();
  });

  it("llama a onRemoveWidget al hacer click en quitar", () => {
    const onRemoveWidget = vi.fn();
    render(
      <TemplateCanvas
        {...defaultProps}
        widgets={mockWidgets}
        onRemoveWidget={onRemoveWidget}
      />,
    );
    fireEvent.click(screen.getByTitle("Quitar widget"));
    expect(onRemoveWidget).toHaveBeenCalledWith("w1");
  });

  it("tiene el atributo data-canvas en el contenedor", () => {
    const { container } = render(<TemplateCanvas {...defaultProps} />);
    const canvas = container.querySelector("[data-canvas]");
    expect(canvas).toBeInTheDocument();
  });

  it("tiene el atributo data-grid en el grid", () => {
    const { container } = render(<TemplateCanvas {...defaultProps} />);
    const grid = container.querySelector("[data-grid]");
    expect(grid).toBeInTheDocument();
  });

  it("renderiza celdas vacías con fondo sutil", () => {
    const { container } = render(<TemplateCanvas {...defaultProps} />);
    const grid = container.querySelector("[data-grid]");
    const cells = grid?.querySelectorAll(".bg-gray-50\\/50");
    expect(cells?.length).toBe(24);
  });

  it("muestra preview de drop cuando hay hoverCell y activeType", () => {
    const { container } = render(
      <TemplateCanvas
        {...defaultProps}
        hoverCell={{ col: 0, row: 0 }}
        activeType="horarios"
      />,
    );
    const grid = container.querySelector("[data-grid]");
    const preview = grid?.querySelector("[data-testid='mock-horarios']");
    expect(preview).toBeInTheDocument();
  });

  it("muestra preview del color correcto según el tipo de widget", () => {
    const { container } = render(
      <TemplateCanvas
        {...defaultProps}
        hoverCell={{ col: 0, row: 2 }}
        activeType="examenes"
      />,
    );
    const grid = container.querySelector("[data-grid]");
    const preview = grid?.querySelector("[data-testid='mock-examenes']");
    expect(preview).toBeInTheDocument();
  });

  it("no muestra preview cuando hoverCell es null", () => {
    const { container } = render(
      <TemplateCanvas
        {...defaultProps}
        hoverCell={null}
        activeType="horarios"
      />,
    );
    const grid = container.querySelector("[data-grid]");
    const previews = grid?.querySelectorAll("[data-testid='mock-horarios']");
    // Solo debe haber el widget colocado, no el preview
    expect(previews?.length).toBe(0);
  });

  it("renderiza múltiples widgets", () => {
    const multiWidgets: WidgetPlacement[] = [
      { id: "w1", type: "horarios", col: 0, row: 0, colSpan: 4, rowSpan: 2 },
      { id: "w2", type: "examenes", col: 0, row: 2, colSpan: 4, rowSpan: 2 },
    ];
    render(<TemplateCanvas {...defaultProps} widgets={multiWidgets} />);
    expect(screen.getByTestId("mock-horarios")).toBeInTheDocument();
    expect(screen.getByTestId("mock-examenes")).toBeInTheDocument();
  });
});
