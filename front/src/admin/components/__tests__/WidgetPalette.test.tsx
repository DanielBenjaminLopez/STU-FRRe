import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { useDraggable } from "@dnd-kit/core";
import WidgetPalette from "../WidgetPalette";
import {
  WIDGET_REGISTRY,
  type WidgetComponentProps,
} from "../../../features/widgets/placement";

vi.mock("@dnd-kit/core", () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}));

function MockHorarios({ colSpan, rowSpan }: WidgetComponentProps) {
  return (
    <div data-testid="mock-horarios" data-size={`${colSpan}x${rowSpan}`}>
      Horarios
    </div>
  );
}
function MockExamenes({ colSpan, rowSpan }: WidgetComponentProps) {
  return (
    <div data-testid="mock-examenes" data-size={`${colSpan}x${rowSpan}`}>
      Exámenes
    </div>
  );
}
function MockCalendario({ colSpan, rowSpan }: WidgetComponentProps) {
  return (
    <div data-testid="mock-calendario" data-size={`${colSpan}x${rowSpan}`}>
      Calendario
    </div>
  );
}
function MockMapa({ colSpan, rowSpan }: WidgetComponentProps) {
  return (
    <div data-testid="mock-mapa" data-size={`${colSpan}x${rowSpan}`}>
      Mapa
    </div>
  );
}
function MockNoticias({ colSpan, rowSpan }: WidgetComponentProps) {
  return (
    <div data-testid="mock-noticias" data-size={`${colSpan}x${rowSpan}`}>
      Noticias
    </div>
  );
}
function MockNovedades({ colSpan, rowSpan }: WidgetComponentProps) {
  return (
    <div data-testid="mock-novedades" data-size={`${colSpan}x${rowSpan}`}>
      Eventos
    </div>
  );
}

const mockComponents = {
  horarios: MockHorarios,
  examenes: MockExamenes,
  calendario: MockCalendario,
  mapa: MockMapa,
  noticias: MockNoticias,
  novedades: MockNovedades,
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
    expect(
      screen.getByRole("heading", { name: "Widgets" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Arrastrá los widgets a la plantilla"),
    ).toBeInTheDocument();
  });

  it("divide la paleta por widget mostrando el encabezado de cada uno", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Horarios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Exámenes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Calendario" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mapa" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Noticias" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Eventos" }),
    ).toBeInTheDocument();
  });

  it("muestra todas las variantes de cada widget con sus dimensiones debajo", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );

    const horariosSection = screen.getByTestId("palette-section-horarios");
    expect(within(horariosSection).getByText("4×2")).toBeInTheDocument();
    expect(within(horariosSection).getByText("2×2")).toBeInTheDocument();

    const examenesSection = screen.getByTestId("palette-section-examenes");
    expect(within(examenesSection).getByText("4×2")).toBeInTheDocument();
    expect(within(examenesSection).getByText("2×2")).toBeInTheDocument();

    const calendarioSection = screen.getByTestId("palette-section-calendario");
    expect(within(calendarioSection).getByText("2×2")).toBeInTheDocument();
    expect(within(calendarioSection).getByText("2×1")).toBeInTheDocument();
    expect(within(calendarioSection).getByText("1×1")).toBeInTheDocument();

    const mapaSection = screen.getByTestId("palette-section-mapa");
    expect(within(mapaSection).getByText("2×2")).toBeInTheDocument();
    expect(within(mapaSection).getByText("2×1")).toBeInTheDocument();

    const noticiasSection = screen.getByTestId("palette-section-noticias");
    expect(within(noticiasSection).getByText("4×2")).toBeInTheDocument();

    const novedadesSection = screen.getByTestId("palette-section-novedades");
    expect(within(novedadesSection).getByText("4×2")).toBeInTheDocument();
  });

  it("renderiza los componentes reales con el colSpan y rowSpan de cada variante", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );

    const calendarioMocks = screen.getAllByTestId("mock-calendario");
    expect(calendarioMocks).toHaveLength(3);
    expect(calendarioMocks.map((el) => el.getAttribute("data-size"))).toEqual([
      "2x2",
      "2x1",
      "1x1",
    ]);

    const horariosMocks = screen.getAllByTestId("mock-horarios");
    expect(horariosMocks).toHaveLength(2);
    expect(horariosMocks.map((el) => el.getAttribute("data-size"))).toEqual([
      "4x2",
      "2x2",
    ]);
  });

  it("configura useDraggable con el tipo y dimensiones de cada variante", () => {
    render(
      <WidgetPalette
        widgets={Object.values(WIDGET_REGISTRY)}
        components={mockComponents}
      />,
    );

    expect(useDraggable).toHaveBeenCalledWith({
      id: "palette-calendario-1x1",
      data: { type: "calendario", colSpan: 1, rowSpan: 1 },
    });
    expect(useDraggable).toHaveBeenCalledWith({
      id: "palette-calendario-2x1",
      data: { type: "calendario", colSpan: 2, rowSpan: 1 },
    });
    expect(useDraggable).toHaveBeenCalledWith({
      id: "palette-horarios-2x2",
      data: { type: "horarios", colSpan: 2, rowSpan: 2 },
    });
  });
});
