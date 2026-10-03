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
      fetchMaterias: vi.fn(),
      fetchHorarios: vi.fn(),
      createHorario: vi.fn(),
      updateHorario: vi.fn(),
      deleteHorario: vi.fn(),
      vaciarHorarios: vi.fn(),
      importarHorariosCSV: vi.fn(),
    };
  },
);

vi.mock("../../../shared/api/carreras", () => ({
  fetchCarreras: vi.fn(),
}));

const mockFetchMaterias = vi.mocked(horariosApi.fetchMaterias);
const mockFetchHorarios = vi.mocked(horariosApi.fetchHorarios);
const mockFetchCarreras = vi.mocked(carrerasApi.fetchCarreras);

describe("MateriasHorariosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMaterias.mockResolvedValue([
      {
        id: 1,
        carrera: 1,
        nombre: "Matemática Discreta",
        carrera_nombre: "Ingeniería en Sistemas",
        carrera_codigo: "ISI",
        carrera_tipo: "grado",
        nivel: "primero",
      },
    ]);
    mockFetchHorarios.mockResolvedValue([
      {
        id: 100,
        materia: 1,
        materia_nombre: "Matemática Discreta",
        carrera_codigo: "ISI",
        carrera_nombre: "Ingeniería en Sistemas",
        nivel: "primero",
        comision: "1ro A",
        espacio: "Aula 2.4",
        dia_semana: "lunes",
        hora_inicio: "08:00:00",
        hora_fin: "10:15:00",
      },
    ]);
    mockFetchCarreras.mockResolvedValue([
      {
        id: 1,
        nombre: "Ingeniería en Sistemas",
        codigo: "ISI",
        tipo: "grado",
      } as never,
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("muestra los horarios en la tabla editable con sus columnas principales", async () => {
    render(<MateriasHorariosPage />);

    expect(await screen.findByText("Matemática Discreta")).toBeInTheDocument();
    expect(screen.getAllByText("ISI").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1ro A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Aula 2.4")).toBeInTheDocument();
    expect(screen.getByText("08:00 - 10:15")).toBeInTheDocument();
  });

  it("abre el modal de vista semanal directo con selectores y permite editar al hacer clic en un bloque", async () => {
    render(<MateriasHorariosPage />);

    await screen.findByText("Matemática Discreta");

    fireEvent.click(screen.getByRole("button", { name: "Vista semanal" }));

    expect(
      await screen.findByRole("heading", { name: "Vista semanal" }),
    ).toBeInTheDocument();
    expect(document.getElementById("schedule")).not.toBeNull();

    const card = document.querySelector(".schedule-class-card") as HTMLElement;
    expect(card).not.toBeNull();
    fireEvent.click(card);

    expect(
      await screen.findByText("Editar horario de cursado"),
    ).toBeInTheDocument();
  });

  it("permite abrir el modal de edición de un horario", async () => {
    render(<MateriasHorariosPage />);

    await screen.findByText("Matemática Discreta");

    fireEvent.click(screen.getByTitle("Editar"));

    expect(
      await screen.findByText("Editar horario de cursado"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Aula 2.4")).toBeInTheDocument();
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
