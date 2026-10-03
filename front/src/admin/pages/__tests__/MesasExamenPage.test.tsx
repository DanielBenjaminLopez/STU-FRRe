import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import MesasExamenPage from "../MesasExamenPage";
import * as mesasApi from "../../../features/examenes/api/mesasExamen";
import * as carrerasApi from "../../../shared/api/carreras";

vi.mock("sileo", () => ({
  sileo: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock(
  "../../../features/examenes/api/mesasExamen",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../features/examenes/api/mesasExamen")
      >();
    return {
      ...actual,
      fetchMesasExamen: vi.fn(),
      createMesaExamen: vi.fn(),
      updateMesaExamen: vi.fn(),
      deleteMesaExamen: vi.fn(),
      fetchMateriasForSelect: vi.fn(),
      importarMesasExamenCSV: vi.fn(),
    };
  },
);

vi.mock("../../../shared/api/carreras", () => ({
  fetchCarreras: vi.fn(),
}));

const mockFetchMesas = vi.mocked(mesasApi.fetchMesasExamen);
const mockFetchMateriasForSelect = vi.mocked(mesasApi.fetchMateriasForSelect);
const mockFetchCarreras = vi.mocked(carrerasApi.fetchCarreras);

describe("MesasExamenPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMesas.mockResolvedValue([]);
    mockFetchMateriasForSelect.mockResolvedValue([
      {
        id: 1,
        carrera: 1,
        nombre: "Matemática Discreta",
        carrera_nombre: "Sistemas",
      },
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
      target: { value: "Aula Magna" },
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
          materia: 1,
          espacio: "Aula Magna",
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
      target: { value: "Aula Magna" },
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
        espacio: "Aula 2",
        fecha: "2026-04-10",
        turno: "abril",
        llamado: 3,
      } as never,
      {
        id: 2,
        materia_nombre: "Química",
        espacio: "Aula 3",
        fecha: "2026-04-12",
        turno: "abril",
        llamado: 3,
      } as never,
    ]);

    render(<MesasExamenPage />);

    expect(await screen.findByText("2 mesas de examen")).toBeInTheDocument();
  });

  describe("importación CSV", () => {
    async function importar(resultado: {
      exito?: boolean;
      detail: string;
      totales: {
        creados: number;
        actualizados: number;
        omitidos: number;
        errores: number;
      };
    }) {
      const mockImportar = vi.mocked(mesasApi.importarMesasExamenCSV);
      mockImportar.mockResolvedValue(resultado as never);

      render(<MesasExamenPage />);

      fireEvent.click(await screen.findByRole("button", { name: "Importar" }));

      const input = await waitFor(() => {
        const el =
          document.querySelector<HTMLInputElement>('input[type="file"]');
        if (!el) throw new Error("no se encontró el input de archivo");
        return el;
      });
      fireEvent.change(input, {
        target: {
          files: [new File(["a,b\n1,2"], "mesas.csv", { type: "text/csv" })],
        },
      });

      fireEvent.click(
        document.querySelector<HTMLButtonElement>(
          'form button[type="submit"]',
        )!,
      );

      await screen.findByText("Resumen de Importación");
      fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    }

    it("muestra toast de error cuando el backend responde exito false", async () => {
      const { sileo } = await import("sileo");
      const mockError = vi.mocked(sileo.error);
      const mockSuccess = vi.mocked(sileo.success);

      await importar({
        exito: false,
        detail: "Importación fallida. Se detectaron 2 errores.",
        totales: { creados: 0, actualizados: 0, omitidos: 0, errores: 2 },
      });

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith(
          expect.objectContaining({ title: "La importación falló" }),
        );
      });
      expect(mockSuccess).not.toHaveBeenCalled();
    });

    it("muestra toast de éxito cuando la importación termina sin errores", async () => {
      const { sileo } = await import("sileo");
      const mockError = vi.mocked(sileo.error);
      const mockSuccess = vi.mocked(sileo.success);

      await importar({
        exito: true,
        detail: "Importación exitosa. 3 creados, 0 actualizados.",
        totales: { creados: 3, actualizados: 0, omitidos: 0, errores: 0 },
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Importación exitosa" }),
        );
      });
      expect(mockError).not.toHaveBeenCalled();
    });
  });
});
