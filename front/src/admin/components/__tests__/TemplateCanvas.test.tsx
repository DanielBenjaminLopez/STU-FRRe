import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import TemplateCanvas from "../TemplateCanvas";
import type { WidgetPlacement } from "../../pages/plantillas/types";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}));

vi.mock("../../../shared/components/widgets/Horarios", () => ({
  default: () => <div data-testid="mock-horarios">Horarios widget</div>,
}));

vi.mock("../../../shared/components/widgets/Examenes", () => ({
  default: () => <div data-testid="mock-examenes">Examenes widget</div>,
}));

const mockWidgets: WidgetPlacement[] = [
  { id: "w1", type: "horarios", col: 0, row: 0 },
];

describe("TemplateCanvas", () => {
  const defaultProps = {
    widgets: [] as WidgetPlacement[],
    nombre: "Test Plantilla",
    onNombreChange: vi.fn(),
    onRemoveWidget: vi.fn(),
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
    render(<TemplateCanvas {...defaultProps} onNombreChange={onNombreChange} />);
    const input = screen.getByDisplayValue("Test Plantilla");
    fireEvent.change(input, { target: { value: "Nuevo nombre" } });
    expect(onNombreChange).toHaveBeenCalledWith("Nuevo nombre");
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

  it("tiene el atributo data-canvas en el grid", () => {
    const { container } = render(<TemplateCanvas {...defaultProps} />);
    const canvas = container.querySelector("[data-canvas]");
    expect(canvas).toBeInTheDocument();
  });

  it("renderiza múltiples widgets", () => {
    const multiWidgets: WidgetPlacement[] = [
      { id: "w1", type: "horarios", col: 0, row: 0 },
      { id: "w2", type: "examenes", col: 0, row: 2 },
    ];
    render(<TemplateCanvas {...defaultProps} widgets={multiWidgets} />);
    expect(screen.getByTestId("mock-horarios")).toBeInTheDocument();
    expect(screen.getByTestId("mock-examenes")).toBeInTheDocument();
  });
});
