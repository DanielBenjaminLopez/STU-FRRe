import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ExamenesFull from "../components/ExamenesFull";
import type { Examen } from "../api/examenes";

const mockUseExamenes = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useExamenes", () => ({
  useExamenes: mockUseExamenes,
}));

const LONGA =
  "Generación, Transmisión y Distribución de la Energía Eléctrica II";

const examenes: Examen[] = [
  {
    id: 1,
    carrera_codigo: "ISI",
    comision: "K1",
    materia_nombre: LONGA,
    hora_inicio: "16:35",
    hora_fin: "18:55",
    dia_semana: "lunes",
    aula: "Laboratorio informático 4",
  },
  {
    id: 2,
    carrera_codigo: "ISI",
    comision: "K1",
    materia_nombre: "Física II",
    hora_inicio: "09:00",
    hora_fin: "11:00",
    dia_semana: "martes",
    aula: "Aula 2",
  },
];

describe("ExamenesFull", () => {
  beforeEach(() => {
    cleanup();
    mockUseExamenes.mockReturnValue({
      todas: examenes,
      loading: false,
      error: null,
    });
  });

  it("renderiza los exámenes de la vista ampliada", () => {
    render(<ExamenesFull onClose={vi.fn()} />);

    expect(screen.getByText("Exámenes")).toBeInTheDocument();
    expect(screen.getByText(LONGA)).toBeInTheDocument();
    expect(screen.getByText("16:35 hs")).toBeInTheDocument();
    expect(screen.getByText(/Laboratorio informático 4/)).toBeInTheDocument();
  });

  it("muestra el skeleton actualizado de exámenes cuando está cargando", () => {
    mockUseExamenes.mockReturnValue({
      todas: [],
      loading: true,
      error: null,
    });

    render(<ExamenesFull onClose={vi.fn()} />);

    expect(
      screen.getByTestId("examenes-schedule-grid-skeleton"),
    ).toBeInTheDocument();
  });

  it("deja wrappear los nombres largos en vez de truncarlos", () => {
    render(<ExamenesFull onClose={vi.fn()} />);

    const nombre = screen.getByText(LONGA);

    expect(nombre).toHaveClass("line-clamp-4");
    expect(nombre).toHaveClass("hyphens-auto");
    expect(nombre).toHaveClass("break-words");
    // `truncate` aplica `white-space: nowrap` y es lo que cortaba los nombres.
    expect(nombre).not.toHaveClass("truncate");
    // Escala de Tailwind, para heredar la duplicación del tótem 4K.
    expect(nombre).toHaveClass("text-xl");
  });
});
