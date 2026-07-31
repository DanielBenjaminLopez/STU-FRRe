import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import TotemsPage from "../TotemsPage";

const { mockFetchTotems, mockFetchEspacios, mockFetchPlantillas, mockRefresh } =
  vi.hoisted(() => ({
    mockFetchTotems: vi.fn(),
    mockFetchEspacios: vi.fn(),
    mockFetchPlantillas: vi.fn(),
    mockRefresh: vi.fn(),
  }));

vi.mock("../../../shared/api/totems", () => ({
  fetchTotems: mockFetchTotems,
  fetchEspacios: mockFetchEspacios,
  fetchPlantillas: () => Promise.resolve([]),
  vincularTotem: vi.fn(),
  updateTotem: vi.fn(),
  deleteTotem: vi.fn(),
}));

vi.mock("../../../shared/api/plantillas", () => ({
  fetchPlantillas: mockFetchPlantillas,
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: [],
    selectedId: "",
    selectedTotem: undefined,
    setSelectedId: vi.fn(),
    refreshTotems: mockRefresh,
  }),
}));

const totems = [
  {
    id: 1,
    nombre: "Hall Central",
    espacio_id: 1,
    espacio_nombre: "Aula Magna",
    activo: true,
    config_pantalla: {},
    vinculado: true,
    plantilla_id: 10,
    plantilla: {
      id: 10,
      nombre: "Plantilla Principal",
      activa: true,
      widgets_posiciones: [],
      creado_en: "",
    },
    creado_en: "",
  },
  {
    id: 2,
    nombre: "",
    espacio_id: null,
    espacio_nombre: null,
    activo: true,
    config_pantalla: {},
    vinculado: false,
    plantilla_id: null,
    plantilla: null,
    creado_en: "",
  },
];

describe("TotemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTotems.mockResolvedValue(totems);
    mockFetchEspacios.mockResolvedValue([
      { id: 1, nombre: "Hall Central", tipo: "hall", piso: 0 },
    ]);
    mockFetchPlantillas.mockResolvedValue([
      {
        id: 10,
        nombre: "Plantilla Principal",
        activa: true,
        widgets_posiciones: [],
        creado_en: "",
      },
    ]);
    mockRefresh.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza la lista de tótems con sus estados", async () => {
    render(<TotemsPage />);
    expect(await screen.findByText("Hall Central")).toBeInTheDocument();
    expect(screen.getByText("Tótem #2")).toBeInTheDocument();
    expect(screen.getByText("Vinculado")).toBeInTheDocument();
    expect(screen.getByText("Sin vincular")).toBeInTheDocument();
    expect(screen.getByText("Plantilla Principal")).toBeInTheDocument();
    expect(screen.getByText("Sin plantilla")).toBeInTheDocument();
  });

  it("abre el modal de vincular al hacer click en el botón", async () => {
    render(<TotemsPage />);
    await screen.findByText("Hall Central");
    fireEvent.click(screen.getByText("Vincular tótem"));
    expect(screen.getByPlaceholderText("Ej: 34735")).toBeInTheDocument();
  });

  it("abre el modal de edición con selector de plantilla", async () => {
    render(<TotemsPage />);
    await screen.findByText("Hall Central");
    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    expect(await screen.findByText("Editar tótem")).toBeInTheDocument();
    expect(screen.getByLabelText("Plantilla asignada")).toBeInTheDocument();
    expect(screen.getByLabelText("Tótem activo")).toBeInTheDocument();
  });

  it("no permite editar un tótem sin vincular", async () => {
    render(<TotemsPage />);
    await screen.findByText("Tótem #2");
    const deleteAndEditButtons = screen.getAllByTitle("Editar");
    fireEvent.click(deleteAndEditButtons[1]);
    expect(
      await screen.findByText(/aún no está vinculado/),
    ).toBeInTheDocument();
  });

  it("abre el modal de confirmación al eliminar", async () => {
    render(<TotemsPage />);
    await screen.findByText("Hall Central");
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    expect(await screen.findByText("Eliminar tótem")).toBeInTheDocument();
  });
});
