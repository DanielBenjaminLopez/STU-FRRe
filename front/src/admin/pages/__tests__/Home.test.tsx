import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Home from "../Home";

const { mockTotems, mockSelectedId, mockSetSelectedId } = vi.hoisted(() => ({
  mockTotems: vi.fn(),
  mockSelectedId: vi.fn(),
  mockSetSelectedId: vi.fn(),
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: mockTotems(),
    selectedId: mockSelectedId(),
    setSelectedId: mockSetSelectedId,
    selectedTotem: undefined,
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
      <a href={to} className={className}>{children}</a>
    ),
  };
});

vi.mock("../../components/TotemPreview", () => ({
  default: () => <div data-testid="totem-preview">TotemPreview</div>,
}));

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("muestra la sección de otros tótems", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByText("Otros tótems")).toBeInTheDocument();
  });

  it("muestra otros tótems excluyendo el seleccionado", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem A", activo: true, vinculado: true, espacio_nombre: "Aula 1A" },
      { id: 2, nombre: "Tótem B", activo: false, vinculado: false, espacio_nombre: "Hall" },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.queryByText("Tótem A")).not.toBeInTheDocument();
    expect(screen.getByText("Tótem B")).toBeInTheDocument();
  });

  it("muestra 'No hay otros tótems' cuando solo hay uno seleccionado", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Único", activo: true, vinculado: true },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("No hay otros tótems")).toBeInTheDocument();
  });

  it("muestra el badge de activo/inactivo en otros tótems", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Seleccionado", activo: true, vinculado: true },
      { id: 2, nombre: "Tótem B", activo: true, vinculado: true },
      { id: 3, nombre: "Tótem C", activo: false, vinculado: true },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("muestra el badge de vinculado/sin vincular en otros tótems", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Seleccionado", activo: true, vinculado: true },
      { id: 2, nombre: "Tótem B", activo: true, vinculado: true },
      { id: 3, nombre: "Tótem C", activo: true, vinculado: false },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Vinculado")).toBeInTheDocument();
    expect(screen.getByText("Sin vincular")).toBeInTheDocument();
  });

  it("muestra el enlace a vincular nuevo tótem", () => {
    mockTotems.mockReturnValue([]);
    mockSelectedId.mockReturnValue("");
    render(<Home />);
    expect(screen.getByText("Vincular nuevo tótem")).toBeInTheDocument();
    expect(screen.getByText("Vincular nuevo tótem").closest("a")).toHaveAttribute("href", "/admin/vincular");
  });

  it("llama a setSelectedId al hacer click en un otro tótem", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem A", activo: true, vinculado: true },
      { id: 2, nombre: "Tótem B", activo: true, vinculado: true },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    fireEvent.click(screen.getByText("Tótem B"));
    expect(mockSetSelectedId).toHaveBeenCalledWith("2");
  });

  it("muestra la ubicación del totem", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem A", activo: true, vinculado: true, espacio_nombre: "Aula 1A" },
      { id: 2, nombre: "Tótem B", activo: true, vinculado: true, espacio_nombre: "Hall Central" },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Hall Central")).toBeInTheDocument();
  });

  it("muestra 'Sin ubicación' cuando no hay espacio_nombre", () => {
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Seleccionado", activo: true, vinculado: true, espacio_nombre: "Aula" },
      { id: 2, nombre: "Tótem B", activo: true, vinculado: true, espacio_nombre: null },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<Home />);
    expect(screen.getByText("Sin ubicación")).toBeInTheDocument();
  });
});
