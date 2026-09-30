import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import MateriasHorariosPage from "../MateriasHorariosPage";
import * as horariosApi from "../../../features/horarios/api/horariosAdmin";
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
  "../../../features/horarios/api/horariosAdmin",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../features/horarios/api/horariosAdmin")
      >();
    return {
      ...actual,
      fetchPlanMaterias: vi.fn(),
      deletePlanMateria: vi.fn(),
      fetchComisiones: vi.fn(),
      createComision: vi.fn(),
      deleteComision: vi.fn(),
      fetchHorarios: vi.fn(),
      createHorario: vi.fn(),
      deleteHorario: vi.fn(),
      fetchEspaciosForSelect: vi.fn(),
      importarHorariosCSV: vi.fn(),
    };
  },
);

vi.mock("../../../shared/api/carreras", () => ({
  fetchCarreras: vi.fn(),
}));

const mockFetchPlanMaterias = vi.mocked(horariosApi.fetchPlanMaterias);
const mockFetchComisiones = vi.mocked(horariosApi.fetchComisiones);
const mockFetchHorarios = vi.mocked(horariosApi.fetchHorarios);
const mockFetchEspacios = vi.mocked(horariosApi.fetchEspaciosForSelect);
const mockFetchCarreras = vi.mocked(carrerasApi.fetchCarreras);

describe("MateriasHorariosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPlanMaterias.mockResolvedValue([
      {
        id: 1,
        carrera: 1,
        materia: 1,
        carrera_nombre: "Ingeniería en Sistemas",
        materia_nombre: "Matemática Discreta",
        carrera_tipo: "grado",
        nivel: "primero",
        plan_estudio: "2023",
      },
    ]);
    mockFetchComisiones.mockResolvedValue([]);
    mockFetchHorarios.mockResolvedValue([]);
    mockFetchEspacios.mockResolvedValue([]);
    mockFetchCarreras.mockResolvedValue([
      { id: 1, nombre: "Ingeniería en Sistemas" } as never,
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("no ofrece filtro por modalidad", async () => {
    render(<MateriasHorariosPage />);

    await screen.findByText("Matemática Discreta");

    expect(screen.queryByText("Modalidad")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Anual" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cuatrimestral" }),
    ).not.toBeInTheDocument();
  });

  it("describe la materia sin modalidad ni cuatrimestre", async () => {
    render(<MateriasHorariosPage />);

    const detalle = await screen.findByText(/Nivel 1ro/);
    expect(detalle).toHaveTextContent(
      "Ingeniería en Sistemas | Nivel 1ro | Plan 2023",
    );
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
      const mockImportar = vi.mocked(horariosApi.importarHorariosCSV);
      mockImportar.mockResolvedValue(resultado as never);

      render(<MateriasHorariosPage />);

      fireEvent.click(await screen.findByRole("button", { name: "Importar" }));

      const input = await waitFor(() => {
        const el =
          document.querySelector<HTMLInputElement>('input[type="file"]');
        if (!el) throw new Error("no se encontró el input de archivo");
        return el;
      });
      fireEvent.change(input, {
        target: {
          files: [new File(["a,b\n1,2"], "horarios.csv", { type: "text/csv" })],
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
        detail: "Importación fallida. Se detectaron 3 errores.",
        totales: { creados: 0, actualizados: 0, omitidos: 0, errores: 3 },
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
        detail: "Importación exitosa. 12 creados, 2 actualizados.",
        totales: { creados: 12, actualizados: 2, omitidos: 0, errores: 0 },
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
