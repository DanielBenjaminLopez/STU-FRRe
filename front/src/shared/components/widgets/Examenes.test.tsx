import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Examenes from "./Examenes";
import type { Examen } from "../../api/examenes";

const mockUseExamenes = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useExamenes", () => ({
  useExamenes: mockUseExamenes,
}));

const mockExamenAhora: Examen = {
  id: 1,
  carrera_codigo: "ISI",
  comision: "K2.1",
  materia_nombre: "Algoritmos y Estructuras de Datos",
  hora_inicio: "08:00",
  hora_fin: "10:00",
  dia_semana: "lunes",
  aula: "1.1",
};

const mockExamenSiguiente: Examen = {
  id: 2,
  carrera_codigo: "IEM",
  comision: "M1.1",
  materia_nombre: "Física II",
  hora_inicio: "10:00",
  hora_fin: "12:00",
  dia_semana: "lunes",
  aula: "1.2",
};

describe("Examenes", () => {
  beforeEach(() => {
    cleanup();
  });

  it("muestra el título y los paneles actuales", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: false,
      error: null,
    });
    render(<Examenes />);
    expect(screen.getByText("Horario de examenes")).toBeInTheDocument();
    expect(screen.getByText("Cursando ahora")).toBeInTheDocument();
    expect(screen.getByText("A continuación")).toBeInTheDocument();
  });

  it("muestra estado de carga", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: true,
      error: null,
    });
    render(<Examenes />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("muestra error", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: false,
      error: "Error de conexión",
    });
    render(<Examenes />);
    expect(screen.getAllByText("Error de conexión")).toHaveLength(2);
  });

  it("muestra exámenes en examinando ahora", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [mockExamenAhora],
      siguiente: [],
      loading: false,
      error: null,
    });
    render(<Examenes />);
    expect(screen.getByText("ISI")).toBeInTheDocument();
    expect(screen.getByText(/\[K2\.1\]/)).toBeInTheDocument();
    expect(
      screen.getByText("Algoritmos y Estructuras de Datos"),
    ).toBeInTheDocument();
    expect(screen.getByText(/08:00/)).toBeInTheDocument();
  });

  it("muestra exámenes en a continuación", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [],
      siguiente: [mockExamenSiguiente],
      loading: false,
      error: null,
    });
    render(<Examenes />);
    expect(screen.getByText("IEM")).toBeInTheDocument();
    expect(screen.getByText(/\[M1\.1\]/)).toBeInTheDocument();
    expect(screen.getByText("Física II")).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it("muestra mensaje vacío en examinando ahora", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [],
      siguiente: [mockExamenSiguiente],
      loading: false,
      error: null,
    });
    render(<Examenes />);
    expect(
      screen.getByText("No hay examenes en este momento"),
    ).toBeInTheDocument();
  });

  it("muestra mensaje vacío en a continuación", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [mockExamenAhora],
      siguiente: [],
      loading: false,
      error: null,
    });
    render(<Examenes />);
    expect(screen.getByText("No hay más examenes hoy")).toBeInTheDocument();
  });

  it("muestra el enlace 'Ver horario completo'", () => {
    mockUseExamenes.mockReturnValue({
      ahora: [],
      siguiente: [],
      loading: false,
      error: null,
    });
    render(<Examenes />);
    expect(screen.getByText("Ver horario completo")).toBeInTheDocument();
  });
});
