import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  act,
  fireEvent,
} from "@testing-library/react";
import Horarios from "../components/Horarios";
import type { Clase } from "../api/horarios";

const mockUseHorarios = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useHorarios", () => ({
  useHorarios: mockUseHorarios,
}));

const mockClaseAhora: Clase = {
  id: 1,
  carrera_codigo: "ISI",
  carrera_nombre: "Ingeniería en Sistemas de Información",
  materia: 1,
  nivel: "primero",
  comision: "K2.1",
  materia_nombre: "Algoritmos y Estructuras de Datos",
  hora_inicio: "08:00",
  hora_fin: "10:00",
  dia_semana: "lunes",
  aula: "1.1",
};

const mockClaseSiguiente: Clase = {
  id: 2,
  carrera_codigo: "IEM",
  carrera_nombre: "Ingeniería Electromecánica",
  materia: 2,
  nivel: "segundo",
  comision: "M1.1",
  materia_nombre: "Física II",
  hora_inicio: "10:00",
  hora_fin: "12:00",
  dia_semana: "lunes",
  aula: "1.2",
};

describe("Horarios", () => {
  beforeEach(() => {
    cleanup();
  });

  it("muestra el título", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      uniqueCarreras: [],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("Horario")).toBeInTheDocument();
  });

  it("muestra estado de carga", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      uniqueCarreras: [],
      loading: true,
      error: null,
    });
    render(<Horarios />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("muestra error", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      uniqueCarreras: [],
      loading: false,
      error: "Error de conexión",
    });
    render(<Horarios />);
    expect(screen.getAllByText("Error de conexión")).toHaveLength(3);
  });

  it("muestra clases en cursando ahora", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [],
      uniqueCarreras: ["ISI"],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getAllByText("ISI").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("K2.1")).toBeInTheDocument();
    expect(
      screen.getByText("Algoritmos y Estructuras de Datos"),
    ).toBeInTheDocument();
    expect(screen.getByText(/08:00.*-.*10:00/)).toBeInTheDocument();
  });

  it("muestra clases en a continuación", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [mockClaseSiguiente],
      uniqueCarreras: ["IEM"],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getAllByText("IEM").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("M1.1")).toBeInTheDocument();
    expect(screen.getByText("Física II")).toBeInTheDocument();
    expect(screen.getByText(/10:00.*-.*12:00/)).toBeInTheDocument();
  });

  it("muestra mensaje vacío en cursando ahora", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [mockClaseSiguiente],
      uniqueCarreras: ["IEM"],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(
      screen.getByText("No hay clases en este momento"),
    ).toBeInTheDocument();
  });

  it("muestra mensaje vacío en a continuación", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [],
      uniqueCarreras: ["ISI"],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("No hay más clases hoy")).toBeInTheDocument();
  });

  it("muestra el enlace 'Ver horario'", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      uniqueCarreras: [],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("Ver horario")).toBeInTheDocument();
  });

  it("muestra el selector de carreras cuando hay carreras disponibles", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [mockClaseSiguiente],
      uniqueCarreras: ["ISI", "IEM"],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(
      screen.getByRole("button", { name: /filtrar horarios por carrera/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ISI").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza correctamente una materia con nombre largo sin romper el diseño", () => {
    const claseLarga: Clase = {
      id: 99,
      carrera_codigo: "TUOMRE",
      carrera_nombre:
        "Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Eléctricas",
      materia: 99,
      nivel: "tercero",
      comision: "Curso 1",
      materia_nombre:
        "Generación, Transmisión y Distribución de la Energía Eléctrica II",
      hora_inicio: "17:20",
      hora_fin: "20:10",
      dia_semana: "martes",
      aula: "12",
    };
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [claseLarga],
      uniqueCarreras: ["TUOMRE"],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(
      screen.getByText(
        "Generación, Transmisión y Distribución de la Energía Eléctrica II",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Curso 1")).toBeInTheDocument();
    expect(screen.getAllByText("TUOMRE").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Aula 12")).toBeInTheDocument();
  });

  it("renderiza los cuadros en fila (grid-cols-2) por defecto (4x2)", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [mockClaseSiguiente],
      uniqueCarreras: ["ISI", "IEM"],
      loading: false,
      error: null,
    });
    render(<Horarios colSpan={4} rowSpan={2} />);
    const widget = screen.getByTestId("horarios-widget");
    const container = screen.getByTestId("horarios-boxes-container");
    expect(widget).toHaveClass("col-span-4", "row-span-2");
    expect(container).toHaveClass("grid-cols-2");
    expect(container).not.toHaveClass("grid-cols-1");
  });

  it("renderiza los cuadros de cursando ahora y a continuación en columna en la variante 2x2", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [mockClaseSiguiente],
      uniqueCarreras: ["ISI", "IEM"],
      loading: false,
      error: null,
    });
    render(<Horarios colSpan={2} rowSpan={2} />);
    const widget = screen.getByTestId("horarios-widget");
    const container = screen.getByTestId("horarios-boxes-container");
    expect(widget).toHaveAttribute("data-variant", "2x2");
    expect(widget).toHaveClass("col-span-2", "row-span-2");
    expect(container).toHaveClass("grid-cols-1", "grid-rows-2");
    expect(screen.getByText("Cursando ahora")).toBeInTheDocument();
    expect(screen.getByText("A continuación")).toBeInTheDocument();
  });

  it("saltea en el ciclo automático las carreras sin materias cursando ni a continuación", () => {
    vi.useFakeTimers();
    try {
      const mockClaseLAR: Clase = {
        ...mockClaseSiguiente,
        id: 3,
        carrera_codigo: "LAR",
        materia_nombre: "Administración Rural",
      };

      mockUseHorarios.mockReturnValue({
        ahora: [mockClaseAhora], // ISI
        siguiente: [mockClaseLAR], // LAR (IEM e IQ no tienen materias)
        uniqueCarreras: ["IEM", "IQ", "ISI", "LAR"],
        loading: false,
        error: null,
      });

      render(<Horarios />);

      const selectBtn = screen.getByRole("button", {
        name: /filtrar horarios por carrera/i,
      });
      // Debe iniciar directamente en ISI (salteando IEM e IQ)
      expect(selectBtn).toHaveTextContent("ISI");
      expect(
        screen.getByText("Algoritmos y Estructuras de Datos"),
      ).toBeInTheDocument();

      // Al avanzar el temporizador, pasa a LAR
      act(() => {
        vi.advanceTimersByTime(15_000);
      });
      expect(selectBtn).toHaveTextContent("LAR");
      expect(screen.getByText("Administración Rural")).toBeInTheDocument();

      // Al volver a avanzar, regresa a ISI sin pasar por IEM ni IQ
      act(() => {
        vi.advanceTimersByTime(15_000);
      });
      expect(selectBtn).toHaveTextContent("ISI");
    } finally {
      vi.useRealTimers();
    }
  });

  it("muestra mensaje central de marca de agua cuando ninguna carrera tiene materias cursando ni a continuación", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      uniqueCarreras: ["IEM", "ISI", "LAR"],
      loading: false,
      error: null,
    });

    render(<Horarios />);

    expect(screen.getByTestId("horarios-empty-watermark")).toBeInTheDocument();
    expect(screen.getByText("No quedan clases hoy.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /filtrar horarios por carrera/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("horarios-boxes-container"),
    ).not.toBeInTheDocument();
  });

  it("abre HorariosFull directamente en la carrera, año y comisión al hacer click en la tarjeta de una materia", () => {
    const otraClaseComision: Clase = {
      id: 10,
      carrera_codigo: "ISI",
      carrera_nombre: "Ingeniería en Sistemas de Información",
      materia: 10,
      nivel: "primero",
      comision: "K2.1",
      materia_nombre: "Análisis Matemático I",
      hora_inicio: "10:00",
      hora_fin: "12:00",
      dia_semana: "martes",
      aula: "1.3",
    };

    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [mockClaseSiguiente],
      todas: [mockClaseAhora, mockClaseSiguiente, otraClaseComision],
      uniqueCarreras: ["ISI", "IEM"],
      loading: false,
      error: null,
    });

    render(<Horarios />);

    fireEvent.click(screen.getByText("Algoritmos y Estructuras de Datos"));

    // Debe abrir directamente la grilla de horarios de esa comisión sin pasar por los pasos de selección
    expect(screen.getByText("Horarios de cursado")).toBeInTheDocument();
    expect(screen.getByText("Cambiar comisión")).toBeInTheDocument();
    expect(
      screen.queryByText("Seleccioná una carrera"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Análisis Matemático I")).toBeInTheDocument();
  });
});
