import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import MesasExamenPage from "../MesasExamenPage";
import * as mesasApi from "../../../shared/api/mesasExamen";
import * as carrerasApi from "../../../shared/api/carreras";

vi.mock("../../../shared/api/mesasExamen", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/mesasExamen")>();
  return {
    ...actual,
    fetchMesasExamen: vi.fn(),
    createMesaExamen: vi.fn(),
    updateMesaExamen: vi.fn(),
    deleteMesaExamen: vi.fn(),
    fetchPlanMaterias: vi.fn(),
    fetchEspaciosForSelect: vi.fn(),
    importarMesasExamenCSV: vi.fn(),
  };
});

vi.mock("../../../shared/api/carreras", () => ({
  fetchCarreras: vi.fn(),
}));

const mockFetchMesas = vi.mocked(mesasApi.fetchMesasExamen);
const mockFetchPlanMaterias = vi.mocked(mesasApi.fetchPlanMaterias);
const mockFetchEspacios = vi.mocked(mesasApi.fetchEspaciosForSelect);
const mockFetchCarreras = vi.mocked(carrerasApi.fetchCarreras);

describe("MesasExamenPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMesas.mockResolvedValue([]);
    mockFetchPlanMaterias.mockResolvedValue([
      {
        id: 1,
        carrera: 1,
        materia_nombre: "Matemática Discreta",
        carrera_nombre: "Sistemas",
      },
    ]);
    mockFetchEspacios.mockResolvedValue([
      { id: 10, nombre: "Aula Magna", tipo: "aula" } as never,
    ]);
    mockFetchCarreras.mockResolvedValue([
      { id: 1, nombre: "Ingeniería en Sistemas" } as never,
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("no muestra el campo Turno en el modal y lo asigna automáticamente al enviar", async () => {
    const mockCreate = vi.mocked(mesasApi.createMesaExamen);
    mockCreate.mockResolvedValue({} as never);

    render(<MesasExamenPage />);

    const nuevoBtn = await screen.findByRole("button", { name: "Nuevo" });
    fireEvent.click(nuevoBtn);

    const heading = await screen.findByRole("heading", {
      name: "Cargar mesa de examen",
    });
    expect(heading).toBeInTheDocument();

    // El campo Turno ya NO debe existir en el modal
    expect(screen.queryByLabelText(/Turno/i)).not.toBeInTheDocument();

    // Completar campos requeridos
    fireEvent.change(screen.getByLabelText(/Materia/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/Espacio/i), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2026-03-15" },
    });
    fireEvent.change(screen.getByLabelText(/Hora/i), {
      target: { value: "09:00" },
    });

    // Guardar
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_materia: 1,
          espacio: 10,
          fecha: "2026-03-15",
          hora: "09:00",
          turno: "marzo",
        }),
      );
    });
  });

  it("calcula automáticamente el turno en diciembre al crear mesa", async () => {
    const mockCreate = vi.mocked(mesasApi.createMesaExamen);
    mockCreate.mockResolvedValue({} as never);

    render(<MesasExamenPage />);

    const nuevoBtn = await screen.findByRole("button", { name: "Nuevo" });
    fireEvent.click(nuevoBtn);

    fireEvent.change(screen.getByLabelText(/Materia/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/Espacio/i), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText(/Hora/i), {
      target: { value: "14:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha: "2026-12-10",
          turno: "diciembre",
        }),
      );
    });
  });

  it("muestra la cantidad de mesas de examen en la esquina izquierda", async () => {
    mockFetchMesas.mockResolvedValue([
      {
        id: 1,
        materia_nombre: "Física I",
        espacio_nombre: "Aula 2",
        fecha: "2026-04-10",
        turno: "abril",
        llamado: 3,
      } as never,
      {
        id: 2,
        materia_nombre: "Química",
        espacio_nombre: "Aula 3",
        fecha: "2026-04-12",
        turno: "abril",
        llamado: 3,
      } as never,
    ]);

    render(<MesasExamenPage />);

    expect(await screen.findByText("2 mesas de examen")).toBeInTheDocument();
  });
});
