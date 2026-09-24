import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import HorariosFull from "./HorariosFull";
import type { Clase } from "../../api/horarios";

const mockUseHorarios = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useHorarios", () => ({
  useHorarios: mockUseHorarios,
}));

const clases: Clase[] = [
  {
    id: 1,
    carrera_codigo: "ISI",
    carrera_nombre: "Ingeniería en Sistemas de Información",
    plan_materia: 1,
    comision_id: 1,
    nivel: "primero",
    modalidad: "anual",
    cuatrimestre: "",
    comision: "K1",
    materia_nombre: "Algoritmos",
    hora_inicio: "09:15",
    hora_fin: "11:00",
    dia_semana: "lunes",
    aula: "Aula 1",
  },
  {
    id: 2,
    carrera_codigo: "ISI",
    carrera_nombre: "Ingeniería en Sistemas de Información",
    plan_materia: 2,
    comision_id: 2,
    nivel: "primero",
    modalidad: "cuatrimestral",
    cuatrimestre: "segundo",
    comision: "K1",
    materia_nombre: "Matemática",
    hora_inicio: "13:30",
    hora_fin: "15:15",
    dia_semana: "martes",
    aula: "Aula 2",
  },
];

function select(label: string, option: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

describe("HorariosFull", () => {
  beforeEach(() => {
    cleanup();
    mockUseHorarios.mockReturnValue({
      todas: clases,
      loading: false,
      error: null,
    });
  });

  it("no muestra la grilla hasta seleccionar carrera, nivel y comisión", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    expect(screen.getByText("Seleccioná una carrera")).toBeInTheDocument();
    expect(screen.queryByText("09:15")).not.toBeInTheDocument();

    select("Seleccionar carrera", "ISI");
    select("Seleccionar nivel", "1ro");

    expect(
      screen.queryByText("Seleccioná una comisión"),
    ).not.toBeInTheDocument();

    select("Seleccionar comisión", "K1");

    expect(screen.getAllByText("09:15")).toHaveLength(2);
    expect(screen.getByText("15:15")).toBeInTheDocument();
    expect(screen.getAllByText("Algoritmos")).toHaveLength(2);
    expect(screen.getByText("Matemática")).toBeInTheDocument();
  });
});
