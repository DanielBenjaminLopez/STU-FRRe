import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Horarios from "./Horarios";
import type { Clase } from "../../api/horarios";

const mockUseHorarios = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useHorarios", () => ({
  useHorarios: mockUseHorarios,
}));

const mockClaseAhora: Clase = {
  id: 1,
  carrera_codigo: "ISI",
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
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("Horario general")).toBeInTheDocument();
  });

  it("muestra estado de carga", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: true,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("Cargando horarios...")).toBeInTheDocument();
  });

  it("muestra error", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: false,
      error: "Error de conexión",
    });
    render(<Horarios />);
    expect(screen.getByText("Error de conexión")).toBeInTheDocument();
  });

  it("muestra clases en cursando ahora", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [mockClaseAhora],
      siguiente: [],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("ISI")).toBeInTheDocument();
    expect(screen.getByText(/\[K2\.1\]/)).toBeInTheDocument();
    expect(
      screen.getByText("Algoritmos y Estructuras de Datos"),
    ).toBeInTheDocument();
    expect(screen.getByText(/08:00.*-.*10:00/)).toBeInTheDocument();
  });

  it("muestra clases en a continuación", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [mockClaseSiguiente],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("IEM")).toBeInTheDocument();
    expect(screen.getByText(/\[M1\.1\]/)).toBeInTheDocument();
    expect(screen.getByText("Física II")).toBeInTheDocument();
    expect(screen.getByText(/10:00.*-.*12:00/)).toBeInTheDocument();
  });

  it("muestra mensaje vacío en cursando ahora", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [mockClaseSiguiente],
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
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("No hay más clases hoy")).toBeInTheDocument();
  });

  it("muestra el enlace 'Ver horario completo'", () => {
    mockUseHorarios.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: false,
      error: null,
    });
    render(<Horarios />);
    expect(screen.getByText("Ver horario completo")).toBeInTheDocument();
  });
});
