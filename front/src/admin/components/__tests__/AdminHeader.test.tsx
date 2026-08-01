import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import AdminHeader from "../AdminHeader";

const {
  mockIsAuthenticated,
  mockUser,
  mockTotems,
  mockSelectedId,
  mockSetSelectedId,
  mockNavigate,
} = vi.hoisted(() => ({
  mockIsAuthenticated: vi.fn(),
  mockUser: vi.fn(),
  mockTotems: vi.fn(),
  mockSelectedId: vi.fn(),
  mockSetSelectedId: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser(),
    isAuthenticated: mockIsAuthenticated(),
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: mockTotems(),
    selectedId: mockSelectedId(),
    setSelectedId: mockSetSelectedId,
    selectedTotem: undefined,
  }),
}));

vi.mock("../../../assets/logo_negro.webp", () => ({ default: "logo.webp" }));

describe("AdminHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedId.mockReturnValue("1");
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el logo", () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockUser.mockReturnValue(null);
    mockTotems.mockReturnValue([]);
    render(<AdminHeader />);
    const logo = screen.getByRole("img", { name: /logo utn/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("draggable", "false");
  });

  it("muestra el dropdown de totems cuando está autenticado", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem Aula 1A", vinculado: true },
    ]);
    render(<AdminHeader />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("muestra las opciones del dropdown de totems", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem Aula 1A", vinculado: true },
      { id: 2, nombre: "Tótem Hall", vinculado: true },
    ]);
    render(<AdminHeader />);
    expect(
      screen.getByRole("option", { name: "Tótem Aula 1A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Tótem Hall" }),
    ).toBeInTheDocument();
  });

  it("muestra 'Sin tótems' cuando no hay totems", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    mockTotems.mockReturnValue([]);
    render(<AdminHeader />);
    expect(
      screen.getByRole("option", { name: "Sin tótems" }),
    ).toBeInTheDocument();
  });

  it("muestra el nombre del usuario autenticado", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    mockTotems.mockReturnValue([]);
    render(<AdminHeader />);
    expect(screen.getByText("Bienvenido,")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("no muestra dropdown ni username sin autenticación", () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockUser.mockReturnValue(null);
    mockTotems.mockReturnValue([]);
    render(<AdminHeader />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Bienvenido,")).not.toBeInTheDocument();
  });

  it("llama a setSelectedId y redirige a Inicio al cambiar el totem seleccionado", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem A", vinculado: true },
      { id: 2, nombre: "Tótem B", vinculado: true },
    ]);
    mockSelectedId.mockReturnValue("1");
    render(<AdminHeader />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(mockSetSelectedId).toHaveBeenCalledWith("2");
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  it("usa nombre del totem como label en el dropdown", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    mockTotems.mockReturnValue([
      { id: 1, nombre: "Tótem Hall Central", vinculado: true },
    ]);
    render(<AdminHeader />);
    expect(
      screen.getByRole("option", { name: "Tótem Hall Central" }),
    ).toBeInTheDocument();
  });
});
