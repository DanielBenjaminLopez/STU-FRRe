import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import PlantillasPage from "../PlantillasPage";
import {
  fetchPlantillas,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
  replacePlantillaWidgets,
} from "../../../shared/api/plantillas";
import { fetchWidgets } from "../../../shared/api/widgets";
import { updateTotem, type Totem } from "../../../shared/api/totems";
import type {
  PlantillaDTO,
  WidgetPosicionDTO,
} from "../../../shared/api/plantillas";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DragOverlay: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => ({})),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
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

vi.mock("../../../shared/components/widgets/Encabezado", () => ({
  default: () => <div data-testid="mock-encabezado">Encabezado</div>,
}));

vi.mock("../../../shared/components/widgets/Mapa", () => ({
  default: () => <div data-testid="mock-mapa">Mapa widget</div>,
}));

vi.mock("../../../shared/hooks/useTotemScale", () => ({
  useTotemScale: () => ({
    containerRef: { current: null },
    scale: 1,
  }),
  TOTEM_WIDTH: 2160,
  TOTEM_HEIGHT: 3840,
}));

vi.mock("../../../shared/api/plantillas", () => ({
  fetchPlantillas: vi.fn(),
  createPlantilla: vi.fn(),
  updatePlantilla: vi.fn(),
  deletePlantilla: vi.fn(),
  replacePlantillaWidgets: vi.fn(),
}));

vi.mock("../../../shared/api/widgets", () => ({
  fetchWidgets: vi.fn(),
}));

vi.mock("../../../shared/api/totems", () => ({
  updateTotem: vi.fn(),
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: vi.fn(),
}));

vi.mock("react-router", () => ({
  useLocation: vi.fn(() => ({
    state: null,
    pathname: "/admin/plantillas",
  })),
}));

import { useTotem } from "../../../shared/context/TotemContext";
import { useLocation } from "react-router";

const mockUseTotem = vi.mocked(useTotem);
const mockUseLocation = vi.mocked(useLocation);
const mockFetchPlantillas = vi.mocked(fetchPlantillas);
const mockCreatePlantilla = vi.mocked(createPlantilla);
const mockUpdatePlantilla = vi.mocked(updatePlantilla);
const mockDeletePlantilla = vi.mocked(deletePlantilla);
const mockReplacePlantillaWidgets = vi.mocked(replacePlantillaWidgets);
const mockFetchWidgets = vi.mocked(fetchWidgets);
const mockUpdateTotem = vi.mocked(updateTotem);

const WIDGETS = [
  {
    id: 1,
    nombre: "Horarios",
    tipo: "horarios",
    col_tam_default: 4,
    fila_tam_default: 2,
    activo: true,
    creado_en: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    nombre: "Exámenes",
    tipo: "examenes",
    col_tam_default: 4,
    fila_tam_default: 2,
    activo: true,
    creado_en: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    nombre: "Calendario",
    tipo: "calendario",
    col_tam_default: 2,
    fila_tam_default: 2,
    activo: true,
    creado_en: "2026-01-01T00:00:00Z",
  },
  {
    id: 4,
    nombre: "Mapa",
    tipo: "mapa",
    col_tam_default: 2,
    fila_tam_default: 2,
    activo: true,
    creado_en: "2026-01-01T00:00:00Z",
  },
];

const HORARIO_POS = {
  id: 11,
  plantilla: 1,
  widget: 1,
  widget_nombre: "Horarios",
  widget_tipo: "horarios",
  col_pos: 0,
  fila_pos: 0,
  col_tam: 4,
  fila_tam: 2,
};

function plantillaDTO(
  id: number,
  nombre: string,
  widgetsPosiciones: WidgetPosicionDTO[] = [],
): PlantillaDTO {
  return {
    id,
    nombre,
    activa: false,
    widgets_posiciones: widgetsPosiciones,
    creado_en: "2026-01-01T00:00:00Z",
  };
}

function mockTotem(overrides: Partial<Totem> = {}): Totem {
  return {
    id: 5,
    nombre: "Kiosco",
    espacio_id: null,
    espacio_nombre: null,
    activo: true,
    config_pantalla: {},
    vinculado: true,
    plantilla_id: null,
    plantilla: null,
    pin_mapa_piso: null,
    pin_mapa_svg_x: null,
    pin_mapa_svg_y: null,
    creado_en: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("PlantillasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTotem.mockReturnValue({
      totems: [],
      selectedId: "",
      selectedTotem: undefined,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    mockUseLocation.mockReturnValue({
      state: null,
      pathname: "/admin/plantillas",
    } as ReturnType<typeof useLocation>);
    mockFetchWidgets.mockResolvedValue(WIDGETS);
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla por defecto", [HORARIO_POS]),
    ]);
    mockCreatePlantilla.mockResolvedValue(plantillaDTO(99, "Nueva plantilla"));
    mockUpdatePlantilla.mockImplementation(async (id) =>
      plantillaDTO(id, "Plantilla por defecto", [HORARIO_POS]),
    );
    mockReplacePlantillaWidgets.mockImplementation(async (id) =>
      plantillaDTO(id, "Plantilla por defecto", [HORARIO_POS]),
    );
    mockDeletePlantilla.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza la paleta de widgets", async () => {
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    expect(
      screen.getByRole("heading", { name: "Widgets" }),
    ).toBeInTheDocument();
  });

  it("carga las plantillas desde la API y muestra su nombre", async () => {
    render(<PlantillasPage />);
    expect(
      await screen.findByText("Plantilla por defecto"),
    ).toBeInTheDocument();
    expect(mockFetchPlantillas).toHaveBeenCalled();
    expect(mockFetchWidgets).toHaveBeenCalled();
  });

  it("renderiza el botón de guardar plantilla", async () => {
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    expect(screen.getByText("Guardar")).toBeInTheDocument();
  });

  it("permite cambiar el nombre de la plantilla con doble click en la píldora", async () => {
    render(<PlantillasPage />);
    const pill = await screen.findByText("Plantilla por defecto");
    fireEvent.doubleClick(pill);
    const input = screen.getByLabelText("Editar nombre de plantilla");
    fireEvent.change(input, { target: { value: "Mi Plantilla" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Mi Plantilla")).toBeInTheDocument();
  });

  it("permite cambiar el nombre de la plantilla al hacer blur", async () => {
    render(<PlantillasPage />);
    const pill = await screen.findByText("Plantilla por defecto");
    fireEvent.doubleClick(pill);
    const input = screen.getByLabelText("Editar nombre de plantilla");
    fireEvent.change(input, { target: { value: "Mi Plantilla 2" } });
    fireEvent.blur(input);
    expect(screen.getByText("Mi Plantilla 2")).toBeInTheDocument();
  });

  it("permite escribir caracteres consecutivos sin que se sobrescriban", async () => {
    render(<PlantillasPage />);
    const pill = await screen.findByText("Plantilla por defecto");
    fireEvent.doubleClick(pill);
    const input = screen.getByLabelText("Editar nombre de plantilla");
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.change(input, { target: { value: "AB" } });
    fireEvent.change(input, { target: { value: "ABC" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("ABC")).toBeInTheDocument();
  });

  it("cancela el cambio de nombre al presionar Escape", async () => {
    render(<PlantillasPage />);
    const pill = await screen.findByText("Plantilla por defecto");
    fireEvent.doubleClick(pill);
    const input = screen.getByLabelText("Editar nombre de plantilla");
    fireEvent.change(input, { target: { value: "Nombre Cancelado" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("Plantilla por defecto")).toBeInTheDocument();
  });

  it("guarda los cambios de una plantilla existente al hacer click en guardar", async () => {
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(mockUpdatePlantilla).toHaveBeenCalledWith(1, {
        nombre: "Plantilla por defecto",
      });
    });
    expect(mockReplacePlantillaWidgets).toHaveBeenCalledWith(1, [
      {
        widget: 1,
        col_pos: 0,
        fila_pos: 0,
        col_tam: 4,
        fila_tam: 2,
      },
    ]);
    expect(
      await screen.findByText("Plantilla guardada correctamente"),
    ).toBeInTheDocument();
  });

  it("crea y guarda una plantilla nueva", async () => {
    mockCreatePlantilla.mockResolvedValue(plantillaDTO(99, "Nueva plantilla"));
    mockReplacePlantillaWidgets.mockResolvedValue(
      plantillaDTO(99, "Nueva plantilla"),
    );
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    fireEvent.click(screen.getByRole("button", { name: "Nueva plantilla" }));
    expect(screen.getByText("Nueva plantilla")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(mockCreatePlantilla).toHaveBeenCalledWith({
        nombre: "Nueva plantilla",
        activa: false,
      });
    });
    expect(mockReplacePlantillaWidgets).toHaveBeenCalledWith(99, []);
  });

  it("muestra el error del backend al fallar el guardado", async () => {
    mockReplacePlantillaWidgets.mockRejectedValue(
      new Error("El widget se superpone"),
    );
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    fireEvent.click(screen.getByText("Guardar"));
    expect(
      await screen.findByText("El widget se superpone"),
    ).toBeInTheDocument();
  });

  it("elimina una plantilla tras confirmar", async () => {
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    fireEvent.click(screen.getByTitle("Eliminar plantilla"));
    expect(
      screen.getByText(/¿Estás seguro de que deseas eliminar/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(mockDeletePlantilla).toHaveBeenCalledWith(1);
    });
  });

  it("selecciona la plantilla asignada al tótem al cargar", async () => {
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla A"),
      plantillaDTO(2, "Plantilla B"),
    ]);
    const totem = mockTotem({ id: 5, plantilla_id: 2 });
    mockUseTotem.mockReturnValue({
      totems: [totem],
      selectedId: "5",
      selectedTotem: totem,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    render(<PlantillasPage />);
    await waitFor(async () => {
      const pill = await screen.findByText("Plantilla B");
      expect(pill.closest('[role="button"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("usa la primera plantilla cuando el tótem no tiene plantilla asignada", async () => {
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla A"),
      plantillaDTO(2, "Plantilla B"),
    ]);
    const totem = mockTotem({ id: 5, plantilla_id: null });
    mockUseTotem.mockReturnValue({
      totems: [totem],
      selectedId: "5",
      selectedTotem: totem,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    render(<PlantillasPage />);
    const pill = await screen.findByText("Plantilla A");
    expect(pill.closest('[role="button"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("selecciona la plantilla del tótem al cambiar la selección en el header", async () => {
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla A"),
      plantillaDTO(2, "Plantilla B"),
    ]);
    const totemA = mockTotem({ id: 5, nombre: "Kiosco", plantilla_id: 1 });
    const totemB = mockTotem({ id: 6, nombre: "Oficina", plantilla_id: 2 });
    mockUseTotem.mockReturnValue({
      totems: [totemA, totemB],
      selectedId: "5",
      selectedTotem: totemA,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    const { rerender } = render(<PlantillasPage />);
    await screen.findByText("Plantilla A");
    mockUseTotem.mockReturnValue({
      totems: [totemA, totemB],
      selectedId: "6",
      selectedTotem: totemB,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    rerender(<PlantillasPage />);
    await waitFor(async () => {
      const pill = await screen.findByText("Plantilla B");
      expect(pill.closest('[role="button"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("muestra toast informativo al llegar desde el primer vínculo sin plantilla", async () => {
    mockFetchPlantillas.mockResolvedValue([plantillaDTO(1, "Plantilla A")]);
    const totem = mockTotem({ id: 5, plantilla_id: null });
    mockUseTotem.mockReturnValue({
      totems: [totem],
      selectedId: "5",
      selectedTotem: totem,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    mockUseLocation.mockReturnValue({
      state: { recienVinculado: true },
      pathname: "/admin/plantillas",
    } as ReturnType<typeof useLocation>);
    render(<PlantillasPage />);
    await screen.findByText("Plantilla A");
    expect(
      screen.getByText(/El tótem aún no tiene plantilla asignada/),
    ).toBeInTheDocument();
  });

  it("muestra el botón Aplicar", async () => {
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    expect(screen.getByText("Aplicar")).toBeInTheDocument();
  });

  it("deshabilita Aplicar cuando no hay tótem seleccionado", async () => {
    mockUseTotem.mockReturnValue({
      totems: [],
      selectedId: "",
      selectedTotem: undefined,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    expect(screen.getByText("Aplicar")).toBeDisabled();
  });

  it("asigna la plantilla al tótem al hacer click en Aplicar", async () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const totem = mockTotem({ id: 5, plantilla_id: null });
    mockUseTotem.mockReturnValue({
      totems: [totem],
      selectedId: "5",
      selectedTotem: totem,
      setSelectedId: vi.fn(),
      refreshTotems: mockRefresh,
    });
    mockUpdateTotem.mockResolvedValue({} as never);
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    fireEvent.click(screen.getByText("Aplicar"));
    await waitFor(() => {
      expect(mockUpdateTotem).toHaveBeenCalledWith(5, { plantilla_id: 1 });
    });
    expect(mockRefresh).toHaveBeenCalled();
    expect(
      await screen.findByText("Plantilla aplicada al tótem correctamente"),
    ).toBeInTheDocument();
  });

  it("muestra Aplicada y deshabilitado si la plantilla ya está asignada al tótem", async () => {
    const totem = mockTotem({ id: 5, plantilla_id: 1 });
    mockUseTotem.mockReturnValue({
      totems: [totem],
      selectedId: "5",
      selectedTotem: totem,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    const btn = screen.getByText("Aplicada");
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("permite seleccionar un widget en el canvas y eliminarlo con el botón Eliminar", async () => {
    const { container } = render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    const canvas = container.querySelector<HTMLElement>("[data-canvas]")!;
    const widgetEl = within(canvas).getByTestId("mock-horarios");
    expect(
      within(canvas).queryByLabelText("Eliminar widget"),
    ).not.toBeInTheDocument();

    fireEvent.click(widgetEl);
    expect(
      within(canvas).getByLabelText("Eliminar widget"),
    ).toBeInTheDocument();

    fireEvent.click(within(canvas).getByLabelText("Eliminar widget"));
    await waitFor(() => {
      expect(
        within(canvas).queryByTestId("mock-horarios"),
      ).not.toBeInTheDocument();
    });
  });

  it("no elimina el widget al presionar la tecla Delete", async () => {
    const { container } = render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    const canvas = container.querySelector<HTMLElement>("[data-canvas]")!;
    const widgetEl = within(canvas).getByTestId("mock-horarios");

    fireEvent.click(widgetEl);
    await waitFor(() => {
      expect(
        within(canvas).getByLabelText("Eliminar widget"),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Delete" });
    // Permanece en el documento porque solo se elimina tocando el botón
    expect(within(canvas).getByTestId("mock-horarios")).toBeInTheDocument();
  });

  it("deselecciona el widget al hacer click en el canvas", async () => {
    const { container } = render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    const canvas = container.querySelector<HTMLElement>("[data-canvas]")!;
    const widgetEl = within(canvas).getByTestId("mock-horarios");

    fireEvent.click(widgetEl);
    await waitFor(() => {
      expect(
        within(canvas).getByLabelText("Eliminar widget"),
      ).toBeInTheDocument();
    });

    fireEvent.click(canvas);
    await waitFor(() => {
      expect(
        within(canvas).queryByLabelText("Eliminar widget"),
      ).not.toBeInTheDocument();
    });
  });

  it("permite limpiar todos los widgets de la plantilla al hacer click en el botón de reiniciar", async () => {
    const { container } = render(<PlantillasPage />);
    await screen.findByText("Plantilla por defecto");
    const canvas = container.querySelector<HTMLElement>("[data-canvas]")!;
    expect(within(canvas).getByTestId("mock-horarios")).toBeInTheDocument();

    const resetBtn = screen.getByLabelText("Limpiar planilla");
    expect(resetBtn).not.toBeDisabled();

    fireEvent.click(resetBtn);
    expect(
      within(canvas).queryByTestId("mock-horarios"),
    ).not.toBeInTheDocument();
    expect(resetBtn).toBeDisabled();
  });
});
