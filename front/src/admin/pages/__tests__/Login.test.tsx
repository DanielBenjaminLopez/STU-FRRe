import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import Login from "../Login";

const { mockLogin, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el formulario de login", () => {
    render(<Login />);
    expect(screen.getByRole("textbox", { name: /usuario/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("renderiza el logo", () => {
    render(<Login />);
    const logo = screen.getByRole("img", { name: /logo/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("draggable", "false");
  });

  it("permite escribir usuario y contraseña", () => {
    render(<Login />);
    const usernameInput = screen.getByRole("textbox", { name: /usuario/i });
    const passwordInput = screen.getByLabelText("Contraseña");
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "pass123" } });
    expect(usernameInput).toHaveValue("admin");
    expect(passwordInput).toHaveValue("pass123");
  });

  it("llama a login y navega al admin en éxito", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<Login />);
    fireEvent.change(screen.getByRole("textbox", { name: /usuario/i }), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "equipobat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin", "equipobat");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/admin/", { replace: true });
  });

  it("muestra error cuando las credenciales son incorrectas", async () => {
    mockLogin.mockRejectedValue(new Error("Credenciales inválidas"));
    render(<Login />);
    fireEvent.change(screen.getByRole("textbox", { name: /usuario/i }), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    expect(
      await screen.findByText("Credenciales inválidas"),
    ).toBeInTheDocument();
  });

  it("muestra error genérico cuando el error no es Error", async () => {
    mockLogin.mockRejectedValue("unknown error");
    render(<Login />);
    fireEvent.change(screen.getByRole("textbox", { name: /usuario/i }), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    expect(
      await screen.findByText("Error al iniciar sesión"),
    ).toBeInTheDocument();
  });

  it("limpia el error al enviar exitosamente después de un error", async () => {
    mockLogin
      .mockRejectedValueOnce(new Error("Error anterior"))
      .mockResolvedValueOnce(undefined);
    render(<Login />);
    const usernameInput = screen.getByRole("textbox", { name: /usuario/i });
    const passwordInput = screen.getByLabelText("Contraseña");
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await screen.findByText("Error anterior");
    fireEvent.change(passwordInput, { target: { value: "correct" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(screen.queryByText("Error anterior")).not.toBeInTheDocument();
    });
  });

  it("no llama a navigate cuando login falla", async () => {
    mockLogin.mockRejectedValue(new Error("Fail"));
    render(<Login />);
    fireEvent.change(screen.getByRole("textbox", { name: /usuario/i }), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
