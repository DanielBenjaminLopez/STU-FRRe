import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AdminLayout from "../AdminLayout";

const { mockIsAuthenticated, mockUser } = vi.hoisted(() => ({
  mockIsAuthenticated: vi.fn(),
  mockUser: vi.fn(),
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
    totems: [],
    selectedId: "",
    selectedTotem: undefined,
    setSelectedId: vi.fn(),
  }),
}));

vi.mock("../../components/AdminHeader", () => ({
  default: () => <header data-testid="admin-header">AdminHeader</header>,
}));

vi.mock("../../components/Sidebar", () => ({
  default: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza children sin autenticación", () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockUser.mockReturnValue(null);
    render(
      <AdminLayout>
        <div>Contenido</div>
      </AdminLayout>,
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("no muestra header ni sidebar sin autenticación", () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockUser.mockReturnValue(null);
    render(
      <AdminLayout>
        <div>Contenido</div>
      </AdminLayout>,
    );
    expect(screen.queryByTestId("admin-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
  });

  it("muestra header y sidebar con autenticación", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Contenido</div>
        </AdminLayout>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("admin-header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("muestra children con autenticación", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUser.mockReturnValue({ username: "admin", is_superuser: true });
    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Página admin</div>
        </AdminLayout>
      </MemoryRouter>,
    );
    expect(screen.getByText("Página admin")).toBeInTheDocument();
  });

  it("usa h-screen en el contenedor principal", () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockUser.mockReturnValue(null);
    const { container } = render(
      <AdminLayout>
        <div>Contenido</div>
      </AdminLayout>,
    );
    const rootDiv = container.firstElementChild;
    expect(rootDiv).toHaveClass("h-screen");
  });

  it("oculta header y sidebar en login (no autenticado)", () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockUser.mockReturnValue(null);
    render(
      <AdminLayout>
        <div>Login page</div>
      </AdminLayout>,
    );
    expect(screen.queryByTestId("admin-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
