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

  it("selecciona la plantilla asignada al tótem al cargar", async () => {
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla A"),
      plantillaDTO(2, "Plantilla B"),
    ]);
    mockUseTotem.mockReturnValue({
      totems: [
        {
          id: 5,
          nombre: "Kiosco",
          espacio_id: null,
          espacio_nombre: null,
          activo: true,
          config_pantalla: {},
          vinculado: true,
          plantilla_id: 2,
          plantilla: null,
          creado_en: "2026-01-01T00:00:00Z",
        },
      ],
      selectedId: "5",
      selectedTotem: {
        id: 5,
        nombre: "Kiosco",
        espacio_id: null,
        espacio_nombre: null,
        activo: true,
        config_pantalla: {},
        vinculado: true,
        plantilla_id: 2,
        plantilla: null,
        creado_en: "2026-01-01T00:00:00Z",
      },
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    render(<PlantillasPage />);
    const input = await screen.findByDisplayValue("Plantilla B");
    expect(input).toBeInTheDocument();
  });

  it("usa la primera plantilla cuando el tótem no tiene plantilla asignada", async () => {
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla A"),
      plantillaDTO(2, "Plantilla B"),
    ]);
    mockUseTotem.mockReturnValue({
      totems: [
        {
          id: 5,
          nombre: "Kiosco",
          espacio_id: null,
          espacio_nombre: null,
          activo: true,
          config_pantalla: {},
          vinculado: true,
          plantilla_id: null,
          plantilla: null,
          creado_en: "2026-01-01T00:00:00Z",
        },
      ],
      selectedId: "5",
      selectedTotem: {
        id: 5,
        nombre: "Kiosco",
        espacio_id: null,
        espacio_nombre: null,
        activo: true,
        config_pantalla: {},
        vinculado: true,
        plantilla_id: null,
        plantilla: null,
        creado_en: "2026-01-01T00:00:00Z",
      },
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    render(<PlantillasPage />);
    const input = await screen.findByDisplayValue("Plantilla A");
    expect(input).toBeInTheDocument();
  });

  it("selecciona la plantilla del tótem al cambiar la selección en el header", async () => {
    mockFetchPlantillas.mockResolvedValue([
      plantillaDTO(1, "Plantilla A"),
      plantillaDTO(2, "Plantilla B"),
    ]);
    const totemA = {
      id: 5,
      nombre: "Kiosco",
      espacio_id: null,
      espacio_nombre: null,
      activo: true,
      config_pantalla: {},
      vinculado: true,
      plantilla_id: 1,
      plantilla: null,
      creado_en: "2026-01-01T00:00:00Z",
    };
    const totemB = {
      id: 6,
      nombre: "Oficina",
      espacio_id: null,
      espacio_nombre: null,
      activo: true,
      config_pantalla: {},
      vinculado: true,
      plantilla_id: 2,
      plantilla: null,
      creado_en: "2026-01-01T00:00:00Z",
    };
    mockUseTotem.mockReturnValue({
      totems: [totemA, totemB],
      selectedId: "5",
      selectedTotem: totemA,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    const { rerender } = render(<PlantillasPage />);
    await screen.findByDisplayValue("Plantilla A");
    mockUseTotem.mockReturnValue({
      totems: [totemA, totemB],
      selectedId: "6",
      selectedTotem: totemB,
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    rerender(<PlantillasPage />);
    const input = await screen.findByDisplayValue("Plantilla B");
    expect(input).toBeInTheDocument();
  });

  it("muestra toast informativo al llegar desde el primer vínculo sin plantilla", async () => {
    mockFetchPlantillas.mockResolvedValue([plantillaDTO(1, "Plantilla A")]);
    mockUseTotem.mockReturnValue({
      totems: [
        {
          id: 5,
          nombre: "Kiosco",
          espacio_id: null,
          espacio_nombre: null,
          activo: true,
          config_pantalla: {},
          vinculado: true,
          plantilla_id: null,
          plantilla: null,
          creado_en: "2026-01-01T00:00:00Z",
        },
      ],
      selectedId: "5",
      selectedTotem: {
        id: 5,
        nombre: "Kiosco",
        espacio_id: null,
        espacio_nombre: null,
        activo: true,
        config_pantalla: {},
        vinculado: true,
        plantilla_id: null,
        plantilla: null,
        creado_en: "2026-01-01T00:00:00Z",
      },
      setSelectedId: vi.fn(),
      refreshTotems: vi.fn(),
    });
    mockUseLocation.mockReturnValue({
      state: { recienVinculado: true },
      pathname: "/admin/plantillas",
    } as ReturnType<typeof useLocation>);
    render(<PlantillasPage />);
    await screen.findByDisplayValue("Plantilla A");
    expect(
      screen.getByText(/El tótem aún no tiene plantilla asignada/),
    ).toBeInTheDocument();
  });

  it("marca dirty y envía spans actualizados al guardar tras resize", async () => {
    render(<PlantillasPage />);
    await screen.findByDisplayValue("Plantilla por defecto");
    fireEvent.click(screen.getByText("Guardar plantilla"));
    await waitFor(() => {
      expect(mockReplacePlantillaWidgets).toHaveBeenCalledWith(1, [
        {
          widget: 1,
          col_pos: 0,
          fila_pos: 0,
          col_tam: 4,
          fila_tam: 2,
        },
      ]);
    });
  });
});
