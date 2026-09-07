import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import Login from "../Login";

const { mockLogin, mockNavigate, mockSileo } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
  mockSileo: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sileo", () => ({
  sileo: mockSileo,
  Toaster: () => null,
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
    expect(
      screen.getByRole("textbox", { name: /usuario/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
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
    expect(mockSileo.success).toHaveBeenCalledWith({
      title: "Sesión iniciada correctamente",
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
    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith({
        title: "Error al iniciar sesión",
        description: "Credenciales inválidas",
      });
    });
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
    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith({
        title: "Error al iniciar sesión",
        description: "Error al iniciar sesión",
      });
    });
  });

  it("muestra toast de error en fallo y luego permite iniciar sesión con éxito", async () => {
    mockLogin
      .mockRejectedValueOnce(new Error("Error anterior"))
      .mockResolvedValueOnce(undefined);
    render(<Login />);
    const usernameInput = screen.getByRole("textbox", { name: /usuario/i });
    const passwordInput = screen.getByLabelText("Contraseña");
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith({
        title: "Error al iniciar sesión",
        description: "Error anterior",
      });
    });
    fireEvent.change(passwordInput, { target: { value: "correct" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(mockSileo.success).toHaveBeenCalledWith({
        title: "Sesión iniciada correctamente",
      });
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

  it("permite ver y ocultar la contraseña con el botón de ojo", () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText("Contraseña");
    const toggleBtn = screen.getByRole("button", { name: /ver contraseña/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    // Click para ver contraseña
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /ocultar contraseña/i }),
    ).toBeInTheDocument();

    // Click para ocultar contraseña
    fireEvent.click(
      screen.getByRole("button", { name: /ocultar contraseña/i }),
    );
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("el botón de ver/ocultar contraseña sigue disponible tras un error de login", async () => {
    mockLogin.mockRejectedValue(new Error("Credenciales inválidas"));
    render(<Login />);

    fireEvent.change(screen.getByRole("textbox", { name: /usuario/i }), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith({
        title: "Error al iniciar sesión",
        description: "Credenciales inválidas",
      });
    });

    const passwordInput = screen.getByLabelText("Contraseña");
    const toggleBtn = screen.getByRole("button", { name: /ver contraseña/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
