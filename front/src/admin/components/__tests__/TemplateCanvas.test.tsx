import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
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
  TOTEM_WIDTH: 2160,
  TOTEM_HEIGHT: 3840,
}));

const mockWidgets: WidgetPlacement[] = [
  { id: "w1", type: "horarios", col: 0, row: 0, colSpan: 4, rowSpan: 2 },
];

describe("TemplateCanvas", () => {
  const defaultProps = {
    widgets: [] as WidgetPlacement[],
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

  it("renderiza el encabezado del totem", () => {
    render(<TemplateCanvas {...defaultProps} />);
    expect(screen.getByTestId("mock-encabezado")).toBeInTheDocument();
  });

  it("renderiza widgets colocados con su componente real", () => {
    render(<TemplateCanvas {...defaultProps} widgets={mockWidgets} />);
    expect(screen.getByTestId("mock-horarios")).toBeInTheDocument();
  });

  it("no muestra el botón de eliminar cuando el widget no está seleccionado", () => {
    render(<TemplateCanvas {...defaultProps} widgets={mockWidgets} />);
    expect(screen.queryByLabelText("Eliminar widget")).not.toBeInTheDocument();
  });

  it("llama a onSelectWidget al hacer click en un widget", () => {
    const onSelectWidget = vi.fn();
    render(
      <TemplateCanvas
        {...defaultProps}
        widgets={mockWidgets}
        onSelectWidget={onSelectWidget}
      />,
    );
    fireEvent.click(screen.getByTestId("mock-horarios"));
    expect(onSelectWidget).toHaveBeenCalledWith("w1");
  });

  it("renderiza el botón de eliminar widget, estilo grayscale y overlay solo cuando está seleccionado", () => {
    const { container } = render(
      <TemplateCanvas
        {...defaultProps}
        widgets={mockWidgets}
        selectedWidgetId="w1"
      />,
    );
    expect(screen.getByLabelText("Eliminar widget")).toBeInTheDocument();
    expect(container.querySelector(".grayscale")).toBeInTheDocument();
    expect(container.querySelector(".bg-black\\/25")).toBeInTheDocument();
  });

  it("llama a onRemoveWidget tras la animación al hacer click en eliminar", async () => {
    const onRemoveWidget = vi.fn();
    render(
      <TemplateCanvas
        {...defaultProps}
        widgets={mockWidgets}
        selectedWidgetId="w1"
        onRemoveWidget={onRemoveWidget}
      />,
    );
    fireEvent.click(screen.getByLabelText("Eliminar widget"));
    await waitFor(() => {
      expect(onRemoveWidget).toHaveBeenCalledWith("w1");
    });
  });

  it("llama a onSelectWidget con null al hacer click fuera del widget", () => {
    const onSelectWidget = vi.fn();
    const { container } = render(
      <TemplateCanvas
        {...defaultProps}
        widgets={mockWidgets}
        selectedWidgetId="w1"
        onSelectWidget={onSelectWidget}
      />,
    );
    const canvas = container.querySelector("[data-canvas]");
    if (canvas) fireEvent.click(canvas);
    expect(onSelectWidget).toHaveBeenCalledWith(null);
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
    render(
      <TemplateCanvas
        {...defaultProps}
        hoverCell={{ col: 0, row: 0 }}
        activeType="horarios"
      />,
    );
    expect(screen.getByTestId("drop-indicator")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Zona para soltar Horarios"),
    ).toBeInTheDocument();
  });

  it("muestra preview con la etiqueta y tamaño según el tipo de widget", () => {
    render(
      <TemplateCanvas
        {...defaultProps}
        hoverCell={{ col: 0, row: 2 }}
        activeType="examenes"
      />,
    );
    expect(screen.getByTestId("drop-indicator")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Zona para soltar Exámenes"),
    ).toBeInTheDocument();
  });

  it("no muestra preview cuando hoverCell es null", () => {
    render(
      <TemplateCanvas
        {...defaultProps}
        hoverCell={null}
        activeType="horarios"
      />,
    );
    expect(screen.queryByTestId("drop-indicator")).not.toBeInTheDocument();
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
