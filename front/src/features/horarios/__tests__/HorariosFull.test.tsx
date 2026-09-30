import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import HorariosFull from "../components/HorariosFull";
import type { Clase } from "../api/horarios";

const mockUseHorarios = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useHorarios", () => ({
  useHorarios: mockUseHorarios,
}));

const LONGA =
  "Generación, Transmisión y Distribución de la Energía Eléctrica II";

const clases: Clase[] = [
  {
    id: 1,
    carrera_codigo: "ISI",
    carrera_nombre: "Ingeniería en Sistemas de Información",
    plan_materia: 1,
    comision_id: 1,
    nivel: "primero",
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
    comision: "K1",
    materia_nombre: "Matemática",
    hora_inicio: "13:30",
    hora_fin: "15:15",
    dia_semana: "martes",
    aula: "Aula 2",
  },
  {
    id: 3,
    carrera_codigo: "ISI",
    carrera_nombre: "Ingeniería en Sistemas de Información",
    plan_materia: 3,
    comision_id: 1,
    nivel: "primero",
    comision: "K1",
    materia_nombre: LONGA,
    hora_inicio: "16:35",
    hora_fin: "18:55",
    dia_semana: "lunes",
    aula: "Laboratorio informático 4",
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

    expect(screen.getByText("09:15")).toBeInTheDocument();
    expect(screen.getByText("15:15")).toBeInTheDocument();
    expect(screen.getByText("Algoritmos")).toBeInTheDocument();
    expect(screen.getByText("Matemática")).toBeInTheDocument();
  });

  it("muestra un solo panel, sin cuatrimestres", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    select("Seleccionar carrera", "ISI");
    select("Seleccionar nivel", "1ro");
    select("Seleccionar comisión", "K1");

    expect(screen.getByText("Horarios de cursado")).toBeInTheDocument();
    expect(screen.queryByText("Primer cuatrimestre")).not.toBeInTheDocument();
    expect(screen.queryByText("Segundo cuatrimestre")).not.toBeInTheDocument();

    // Cada clase se dibuja una sola vez: no hay un panel por cuatrimestre que
    // duplique los horarios de las materias.
    expect(screen.getAllByText("Algoritmos")).toHaveLength(1);
    expect(screen.getAllByText("Matemática")).toHaveLength(1);
  });

  it("muestra el nombre completo de las materias largas y lo deja wrappear", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    select("Seleccionar carrera", "ISI");
    select("Seleccionar nivel", "1ro");
    select("Seleccionar comisión", "K1");

    // El texto completo llega al DOM: no se recorta en el marcado, solo se
    // acotan visualmente las líneas.
    expect(screen.getByText(LONGA)).toBeInTheDocument();

    const nombre = screen.getByText(LONGA);
    expect(nombre).toHaveClass("line-clamp-4");
    expect(nombre).toHaveClass("hyphens-auto");
    expect(nombre).toHaveClass("break-words");

    // `truncate` fuerza una sola línea (`white-space: nowrap`), que era lo que
    // cortaba los nombres largos. No debe volver.
    expect(nombre).not.toHaveClass("truncate");

    // Las horas y el aula tampoco se recortan. La comisión y el aula comparten
    // un solo nodo de texto: "[K1] · Laboratorio informático 4".
    expect(screen.getByText("16:35 - 18:55")).toBeInTheDocument();
    expect(screen.getByText(/Laboratorio informático 4/)).toBeInTheDocument();
  });

  it("escala la grilla con la tipografía del tótem, sin px fijos", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    select("Seleccionar carrera", "ISI");
    select("Seleccionar nivel", "1ro");
    select("Seleccionar comisión", "K1");

    const grilla = document.getElementById("schedule");
    expect(grilla).not.toBeNull();

    // La geometría va en `em` contra var(--text-base) para que las variables
    // --text-* que duplican dentro de .totem-scale-stage también agranden las
    // filas. Con px fijo la grilla queda a media escala en el tótem 4K.
    expect(grilla!.style.gridTemplateColumns).toContain("em");
    expect(grilla!.style.gridTemplateColumns).not.toMatch(/\d+px/);
    expect(grilla!.style.gridTemplateRows).toContain("em");
    expect(grilla!.style.gridTemplateRows).not.toMatch(/\d+px/);

    // El nombre usa la escala de Tailwind (text-lg), no un px arbitrario: así
    // hereda la duplicación del tótem.
    expect(screen.getByText(LONGA)).toHaveClass("text-lg");
  });
});
