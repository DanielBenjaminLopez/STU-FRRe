import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import AvisosPage from "../AvisosPage";
import * as avisosApi from "../../../shared/api/avisos";

vi.mock("../../../shared/api/avisos", () => ({
  fetchAvisos: vi.fn(),
  createAviso: vi.fn(),
  updateAviso: vi.fn(),
  deleteAviso: vi.fn(),
  TIPOS_AVISO: [
    { value: "general", label: "General" },
    { value: "suspendido", label: "Suspendido" },
  ],
}));

const mockFetchAvisos = vi.mocked(avisosApi.fetchAvisos);
const mockCreateAviso = vi.mocked(avisosApi.createAviso);
const mockUpdateAviso = vi.mocked(avisosApi.updateAviso);
const mockDeleteAviso = vi.mocked(avisosApi.deleteAviso);

const AVISOS = [
  { id: 1, tipo: "general", motivo: "Aviso de prueba", fecha: "2026-08-01" },
  {
    id: 2,
    tipo: "suspendido",
    motivo: "Clases suspendidas",
    fecha: "2026-08-05",
  },
];

describe("AvisosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAvisos.mockResolvedValue(AVISOS as never);
    mockCreateAviso.mockResolvedValue({} as never);
    mockUpdateAviso.mockResolvedValue({} as never);
    mockDeleteAviso.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título y subtítulo", async () => {
    render(<AvisosPage />);
    expect(screen.getByText("Avisos")).toBeInTheDocument();
    expect(
      screen.getByText("Gestión de avisos y suspensiones"),
    ).toBeInTheDocument();
  });

  it("carga y muestra los avisos en la tabla", async () => {
    render(<AvisosPage />);
    await waitFor(() => {
      expect(screen.getByText("Aviso de prueba")).toBeInTheDocument();
    });
    expect(screen.getByText("Clases suspendidas")).toBeInTheDocument();
    expect(mockFetchAvisos).toHaveBeenCalled();
  });

  it("muestra el botón de crear aviso", async () => {
    render(<AvisosPage />);
    await waitFor(() => {
      expect(screen.getByText("Aviso de prueba")).toBeInTheDocument();
    });
    expect(screen.getByText("Crear aviso")).toBeInTheDocument();
  });

  it("abre modal de crear aviso", async () => {
    render(<AvisosPage />);
    await waitFor(() => {
      expect(screen.getByText("Aviso de prueba")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Crear aviso"));
    expect(
      screen.getByRole("heading", { name: "Crear aviso" }),
    ).toBeInTheDocument();
  });

  it("crea un aviso al guardar el formulario", async () => {
    render(<AvisosPage />);
    await waitFor(() => {
      expect(screen.getByText("Aviso de prueba")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Crear aviso"));

    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: "general" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2026-08-10" },
    });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: "Nuevo aviso" },
    });

    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(mockCreateAviso).toHaveBeenCalled();
    });
  });

  it("elimina un aviso tras confirmar", async () => {
    render(<AvisosPage />);
    await waitFor(() => {
      expect(screen.getByText("Aviso de prueba")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText(/¿Estás seguro/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(mockDeleteAviso).toHaveBeenCalledWith(1);
    });
  });

  it("muestra error al cargar datos", async () => {
    mockFetchAvisos.mockRejectedValue(new Error("Error de carga"));
    render(<AvisosPage />);
    expect(await screen.findByText("Error de carga")).toBeInTheDocument();
  });

  it("permite buscar aviso por texto", async () => {
    render(<AvisosPage />);
    await waitFor(() => {
      expect(screen.getByText("Aviso de prueba")).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/Buscar aviso/);
    fireEvent.change(searchInput, { target: { value: "suspendidas" } });
    expect(screen.getByText("Clases suspendidas")).toBeInTheDocument();
  });
});
