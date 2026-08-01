import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import Home from "../Home";

const {
  mockTotems,
  mockSelectedId,
  mockSetSelectedId,
  mockRefresh,
  mockFetchEspacios,
  mockFetchPlantillas,
  mockUpdateTotem,
  mockDeleteTotem,
} = vi.hoisted(() => ({
  mockTotems: vi.fn(),
  mockSelectedId: vi.fn(),
  mockSetSelectedId: vi.fn(),
  mockRefresh: vi.fn(),
  mockFetchEspacios: vi.fn(),
  mockFetchPlantillas: vi.fn(),
  mockUpdateTotem: vi.fn(),
  mockDeleteTotem: vi.fn(),
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: mockTotems(),
    selectedId: mockSelectedId(),
    setSelectedId: mockSetSelectedId,
    selectedTotem: undefined,
    refreshTotems: mockRefresh,
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

vi.mock("../../../shared/api/totems", () => ({
  fetchEspacios: mockFetchEspacios,
  updateTotem: mockUpdateTotem,
  deleteTotem: mockDeleteTotem,
}));

vi.mock("../../../shared/api/plantillas", () => ({
  fetchPlantillas: mockFetchPlantillas,
}));

vi.mock("../../components/TotemPreview", () => ({
  default: () => <div data-testid="totem-preview">TotemPreview</div>,
}));

const plantilla = {
  id: 10,
  nombre: "Plantilla Principal",
  activa: true,
  widgets_posiciones: [],
  creado_en: "",
};

const vinculado = {
  id: 1,
  nombre: "Tótem A",
  espacio_id: 1,
  espacio_nombre: "Aula 1A",
  activo: true,
  config_pantalla: {},
  vinculado: true,
  plantilla_id: 10,
  plantilla,
  creado_en: "",
};

const sinVincular = {
  id: 2,
  nombre: "",
  espacio_id: null,
  espacio_nombre: null,
  activo: false,
  config_pantalla: {},
  vinculado: false,
  plantilla_id: null,
  plantilla: null,
  creado_en: "",
};

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
    mockFetchEspacios.mockResolvedValue([
      { id: 1, nombre: "Hall Central", tipo: "hall", piso: 0 },
    ]);
    mockFetchPlantillas.mockResolvedValue([plantilla]);
    mockUpdateTotem.mockResolvedValue({});
    mockDeleteTotem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el componente TotemPreview", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByTestId("totem-preview")).toBeInTheDocument();
  });

  it("muestra la sección de tótems", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByText("Tótems")).toBeInTheDocument();
  });

  it("muestra todos los tótems incluyendo el seleccionado", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Tótem A")).toBeInTheDocument();
    expect(screen.getByText("Tótem #2")).toBeInTheDocument();
  });

  it("marca el tótem seleccionado como Actual", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Actual")).toBeInTheDocument();
  });

  it("muestra 'No hay tótems' cuando no hay tótems", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByText("No hay tótems")).toBeInTheDocument();
  });

  it("muestra el badge de activo/inactivo", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("muestra el badge de vinculado/pendiente", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Vinculado")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de vinculación")).toBeInTheDocument();
  });

  it("muestra la plantilla asignada del tótem", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Plantilla Principal")).toBeInTheDocument();
    expect(screen.getByText("Sin plantilla")).toBeInTheDocument();
  });

  it("muestra el enlace a vincular nuevo tótem", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByText("Vincular nuevo tótem")).toBeInTheDocument();
    expect(
      screen.getByText("Vincular nuevo tótem").closest("a"),
    ).toHaveAttribute("href", "/admin/vincular");
  });

  it("llama a setSelectedId al hacer click en un tótem", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByText("Tótem #2"));
    expect(mockSetSelectedId).toHaveBeenCalledWith("2");
  });

  it("muestra la ubicación del tótem", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Aula 1A")).toBeInTheDocument();
  });

  it("muestra 'Sin ubicación' cuando no hay espacio_nombre", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Sin ubicación")).toBeInTheDocument();
  });

  it("muestra Eliminar para todos y Editar solo para vinculados", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getAllByTitle("Editar")).toHaveLength(1);
    expect(screen.getAllByTitle("Eliminar")).toHaveLength(2);
  });

  it("abre el modal de edición con selector de plantilla", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByTitle("Editar"));
    expect(screen.getByText("Editar tótem")).toBeInTheDocument();
    expect(screen.getByLabelText("Plantilla asignada")).toBeInTheDocument();
    expect(screen.getByLabelText("Tótem activo")).toBeInTheDocument();
  });

  it("abre el modal de confirmación al eliminar", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    expect(screen.getByText("Eliminar tótem")).toBeInTheDocument();
  });

  it("actualiza el tótem y refresca la lista", async () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByTitle("Editar"));
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(mockUpdateTotem).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("elimina el tótem al confirmar y refresca la lista", async () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    const confirmButton = screen.getAllByText("Eliminar").at(-1) as HTMLElement;
    fireEvent.click(confirmButton);
    await waitFor(() => expect(mockDeleteTotem).toHaveBeenCalledWith(1));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
