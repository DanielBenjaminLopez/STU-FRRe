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
  mockFetchPlantillas,
  mockUpdateTotem,
  mockDeleteTotem,
} = vi.hoisted(() => ({
  mockTotems: vi.fn(),
  mockSelectedId: vi.fn(),
  mockSetSelectedId: vi.fn(),
  mockRefresh: vi.fn(),
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
  updateTotem: mockUpdateTotem,
  deleteTotem: mockDeleteTotem,
}));

vi.mock("../../../shared/api/plantillas", () => ({
  fetchPlantillas: mockFetchPlantillas,
}));

vi.mock("../../components/TotemPreview", () => ({
  default: () => <div data-testid="totem-preview">TotemPreview</div>,
}));

vi.mock("../../components/VincularTotemModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="vincular-totem-modal">
      <span>Vincular nuevo tótem</span>
      <button onClick={onClose}>Cerrar Modal</button>
    </div>
  ),
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

const inactivo = {
  id: 3,
  nombre: "Tótem Inactivo",
  espacio_id: null,
  espacio_nombre: null,
  activo: false,
  config_pantalla: {},
  vinculado: true,
  plantilla_id: null,
  plantilla: null,
  creado_en: "",
};

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
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

  it("muestra la sección de tótems vinculados", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByText("Tótems vinculados")).toBeInTheDocument();
  });

  it("muestra solo los tótens vinculados", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Tótem A")).toBeInTheDocument();
    expect(screen.queryByText("Tótem #2")).not.toBeInTheDocument();
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

  it("muestra el indicador de activo/inactivo", () => {
    mockTotems.mockReturnValue([vinculado, inactivo]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByTitle("Activo")).toBeInTheDocument();
    expect(screen.getByTitle("Inactivo")).toBeInTheDocument();
  });

  it("no muestra el badge redundante de vinculado", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.queryByText("Vinculado")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin vincular")).not.toBeInTheDocument();
  });

  it("muestra la plantilla asignada del tótem", () => {
    mockTotems.mockReturnValue([vinculado]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Plantilla Principal")).toBeInTheDocument();
  });

  it("abre el modal de vincular nuevo tótem al hacer click en Nuevo tótem", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    const btn = screen.getByRole("button", { name: /nuevo t[oó]tem/i });
    expect(btn).toBeInTheDocument();
    expect(
      screen.queryByTestId("vincular-totem-modal"),
    ).not.toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByTestId("vincular-totem-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cerrar Modal"));
    expect(
      screen.queryByTestId("vincular-totem-modal"),
    ).not.toBeInTheDocument();
  });

  it("llama a setSelectedId al hacer click en un tótem", () => {
    mockTotems.mockReturnValue([vinculado]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    fireEvent.click(screen.getByText("Tótem A"));
    expect(mockSetSelectedId).toHaveBeenCalledWith("1");
  });

  it("muestra Eliminar para todos y Editar solo para vinculados", () => {
    mockTotems.mockReturnValue([vinculado, sinVincular]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getAllByTitle("Editar")).toHaveLength(1);
    expect(screen.getAllByTitle("Eliminar")).toHaveLength(1);
  });

  it("abre el modal de edición con selector de plantilla", () => {
    mockTotems.mockReturnValue([vinculado]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByTitle("Editar"));
    expect(screen.getByText("Editar tótem")).toBeInTheDocument();
    expect(screen.getByLabelText("Plantilla asignada")).toBeInTheDocument();
    expect(screen.getByLabelText("Tótem activo")).toBeInTheDocument();
  });

  it("abre el modal de confirmación al eliminar", () => {
    mockTotems.mockReturnValue([vinculado]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByTitle("Eliminar"));
    expect(screen.getByText("Eliminar tótem")).toBeInTheDocument();
  });

  it("actualiza el tótem y refresca la lista", async () => {
    mockTotems.mockReturnValue([vinculado]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByTitle("Editar"));
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(mockUpdateTotem).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("elimina el tótem al confirmar y refresca la lista", async () => {
    mockTotems.mockReturnValue([vinculado]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByTitle("Eliminar"));
    const confirmButton = screen.getAllByText("Eliminar").at(-1) as HTMLElement;
    fireEvent.click(confirmButton);
    await waitFor(() => expect(mockDeleteTotem).toHaveBeenCalledWith(1));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
