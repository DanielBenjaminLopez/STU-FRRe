import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Sidebar from "../Sidebar";

const mockLogout = vi.fn();

vi.mock("../../../shared/context/AuthContext", () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: { username: "admin" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    NavLink: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string | ((args: { isActive: boolean }) => string);
    }) => {
      const isActive = to === "/admin";
      const cls =
        typeof className === "function" ? className({ isActive }) : className;
      return (
        <a href={to} className={cls}>
          {children}
        </a>
      );
    },
  };
});

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza todos los items de navegación", () => {
    render(<Sidebar />);
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Horarios")).toBeInTheDocument();
    expect(screen.getByText("Mesas de examen")).toBeInTheDocument();
    expect(screen.getByText("Noticias y Eventos")).toBeInTheDocument();
    expect(screen.getByText("Avisos")).toBeInTheDocument();
    expect(screen.getByText("Plantillas")).toBeInTheDocument();
  });

  it("renderiza el botón de cerrar sesión", () => {
    render(<Sidebar />);
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("llama a logout al hacer click en cerrar sesión", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText("Cerrar sesión"));
    expect(mockLogout).toHaveBeenCalled();
  });

  it("tiene 6 items de navegación", () => {
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(6);
  });

  it("tiene clase w-48 en el aside", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-48");
  });

  it("tiene clase h-full en el aside", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("h-full");
  });
});
