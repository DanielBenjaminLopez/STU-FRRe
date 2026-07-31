import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
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

vi.mock("../../../shared/hooks/useTotemScale", () => ({
  useTotemScale: () => ({
    containerRef: { current: null },
    scale: 1,
  }),
  TOTEM_WIDTH: 1080,
  TOTEM_HEIGHT: 1920,
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

const mockFetchPlantillas = vi.mocked(fetchPlantillas);
const mockCreatePlantilla = vi.mocked(createPlantilla);
const mockUpdatePlantilla = vi.mocked(updatePlantilla);
const mockDeletePlantilla = vi.mocked(deletePlantilla);
const mockReplacePlantillaWidgets = vi.mocked(replacePlantillaWidgets);
const mockFetchWidgets = vi.mocked(fetchWidgets);

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

describe("PlantillasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    await screen.findByDisplayValue("Plantilla por defecto");
    expect(screen.getByText("Agregar elementos")).toBeInTheDocument();
  });

  it("carga las plantillas desde la API y muestra su nombre", async () => {
    render(<PlantillasPage />);
    expect(
      await screen.findByDisplayValue("Plantilla por defecto"),
    ).toBeInTheDocument();
    expect(mockFetchPlantillas).toHaveBeenCalled();
    expect(mockFetchWidgets).toHaveBeenCalled();
  });

  it("renderiza el botón de guardar plantilla", async () => {
    render(<PlantillasPage />);
    await screen.findByDisplayValue("Plantilla por defecto");
    expect(screen.getByText("Guardar plantilla")).toBeInTheDocument();
  });

  it("permite cambiar el nombre de la plantilla", async () => {
    render(<PlantillasPage />);
    const input = await screen.findByDisplayValue("Plantilla por defecto");
    fireEvent.change(input, { target: { value: "Mi Plantilla" } });
    expect(screen.getByDisplayValue("Mi Plantilla")).toBeInTheDocument();
  });

  it("guarda los cambios de una plantilla existente al hacer click en guardar", async () => {
    render(<PlantillasPage />);
    await screen.findByDisplayValue("Plantilla por defecto");
    fireEvent.click(screen.getByText("Guardar plantilla"));
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
    await screen.findByDisplayValue("Plantilla por defecto");
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("Nueva plantilla")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Guardar plantilla"));
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
    await screen.findByDisplayValue("Plantilla por defecto");
    fireEvent.click(screen.getByText("Guardar plantilla"));
    expect(
      await screen.findByText("El widget se superpone"),
    ).toBeInTheDocument();
  });

  it("elimina una plantilla tras confirmar", async () => {
    render(<PlantillasPage />);
    await screen.findByDisplayValue("Plantilla por defecto");
    fireEvent.click(screen.getByTitle("Eliminar plantilla"));
    expect(
      screen.getByText(/¿Estás seguro de que deseas eliminar/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(mockDeletePlantilla).toHaveBeenCalledWith(1);
    });
  });
});
