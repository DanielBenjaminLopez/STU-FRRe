import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import HorariosFull from "../components/HorariosFull";
import type { Clase } from "../api/horarios";

const mockUseHorarios = vi.hoisted(() => vi.fn());
const mockPublicFetch = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useHorarios", () => ({
  useHorarios: mockUseHorarios,
}));

// El tótem puede seguir publicando un cuatrimestre vigente. La grilla no debe
// filtrar por él: si algún día volviera a hacerlo, este mock lo detectaría.
vi.mock("../../../shared/api/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/client")>();
  return { ...actual, publicFetch: mockPublicFetch };
});

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

function selectCursoISI1roK1() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Ingeniería en Sistemas de Información",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "1ro" }));
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
    expect(
      screen.queryByRole("button", { name: "Seleccionar carrera" }),
    ).not.toBeInTheDocument();

    selectCursoISI1roK1();

    expect(
      screen.queryByText("Seleccioná una comisión"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Cambiar comisión")).toBeInTheDocument();

    expect(screen.getByText("09:15")).toBeInTheDocument();
    expect(screen.getByText("15:15")).toBeInTheDocument();
    expect(screen.getByText("Algoritmos")).toBeInTheDocument();
    expect(screen.getByText("Matemática")).toBeInTheDocument();
  });

  it("muestra un solo panel, sin cuatrimestres", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    selectCursoISI1roK1();

    expect(screen.getByText("Horarios de cursado")).toBeInTheDocument();
    expect(screen.queryByText("Primer cuatrimestre")).not.toBeInTheDocument();
    expect(screen.queryByText("Segundo cuatrimestre")).not.toBeInTheDocument();

    // Cada clase se dibuja una sola vez: no hay un panel por cuatrimestre que
    // duplique los horarios de las materias.
    expect(screen.getAllByText("Algoritmos")).toHaveLength(1);
    expect(screen.getAllByText("Matemática")).toHaveLength(1);
  });

  it("no filtra la grilla aunque exista un cuatrimestre vigente", async () => {
    mockPublicFetch.mockResolvedValue({
      cuatrimestre_vigente: "segundo",
      configurado: true,
    });

    render(<HorariosFull onClose={vi.fn()} />);

    selectCursoISI1roK1();

    expect(await screen.findByText("Horarios de cursado")).toBeInTheDocument();
    expect(screen.getByText("Algoritmos")).toBeInTheDocument();
    expect(screen.getByText("Matemática")).toBeInTheDocument();
    expect(screen.getByText(LONGA)).toBeInTheDocument();
    expect(screen.getByText("09:15")).toBeInTheDocument();
    expect(screen.getByText("15:15")).toBeInTheDocument();
  });

  it("muestra el nombre completo de las materias largas y lo deja wrappear", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    selectCursoISI1roK1();

    // El texto completo llega al DOM: no se recorta en el marcado, solo se
    // acotan visualmente las líneas.
    expect(screen.getByText(LONGA)).toBeInTheDocument();

    const nombre = screen.getByText(LONGA);
    expect(nombre).toHaveClass("shrink-0");
    expect(nombre).toHaveClass("hyphens-auto");
    expect(nombre).toHaveClass("break-words");

    // No debe tener `truncate` ni `line-clamp-*` para que el nombre siempre se
    // muestre completo y la celda se expanda si hace falta.
    expect(nombre).not.toHaveClass("truncate");
    expect(nombre.className).not.toMatch(/line-clamp/);

    // Las horas y el aula tampoco se recortan. La comisión no se repite en cada
    // tarjeta (ya está seleccionada en los filtros) y el aula se destaca al pie.
    expect(screen.getByText("16:35 - 18:55")).toBeInTheDocument();

    const tarjeta = screen
      .getByText("Laboratorio informático 4")
      .closest(".schedule-class-card")!;
    expect(tarjeta.querySelector(".schedule-class-comision")).toBeNull();
    expect(tarjeta.querySelector(".schedule-class-aula")).toHaveTextContent(
      "Laboratorio informático 4",
    );
  });

  it("escala la grilla con la tipografía del tótem, sin px fijos", () => {
    render(<HorariosFull onClose={vi.fn()} />);

    selectCursoISI1roK1();

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

  it("amplía la columna del día y ubica una al lado de otra las materias simultáneas", () => {
    mockUseHorarios.mockReturnValue({
      todas: [
        ...clases,
        {
          id: 4,
          carrera_codigo: "ISI",
          carrera_nombre: "Ingeniería en Sistemas de Información",
          plan_materia: 4,
          comision_id: 1,
          nivel: "primero",
          comision: "K1",
          materia_nombre: "Proyecto",
          hora_inicio: "16:35",
          hora_fin: "18:55",
          dia_semana: "lunes",
          aula: "Laboratorio CISCO",
        },
      ],
      loading: false,
      error: null,
    });

    render(<HorariosFull onClose={vi.fn()} />);

    selectCursoISI1roK1();

    const grilla = document.getElementById("schedule")!;
    // 5 días hábiles (sin sábado porque no hay clases) + 1 subcolumna extra para el lunes = 6 tracks
    expect(grilla.style.gridTemplateColumns).toContain(
      "repeat(6, minmax(0, 1fr))",
    );
    expect(screen.queryByText("Sáb")).not.toBeInTheDocument();

    const headerLunes = screen.getByText("Lun");
    expect(headerLunes.style.gridColumn).toBe("2 / span 2");

    const wrapperLonga = screen
      .getByText(LONGA)
      .closest(".schedule-class-wrapper") as HTMLElement;
    const wrapperProyecto = screen
      .getByText("Proyecto")
      .closest(".schedule-class-wrapper") as HTMLElement;

    // Las dos materias simultáneas del lunes van en subcolumnas adyacentes (2 y 3)
    expect(wrapperLonga.style.gridColumn).toBe("2 / span 1");
    expect(wrapperProyecto.style.gridColumn).toBe("3 / span 1");

    // La materia del lunes a la mañana que no se solapa ocupa todo el ancho del día (span 2)
    const wrapperAlgoritmos = screen
      .getByText("Algoritmos")
      .closest(".schedule-class-wrapper") as HTMLElement;
    expect(wrapperAlgoritmos.style.gridColumn).toBe("2 / span 2");
  });

  it("muestra la columna Sáb solo cuando la comisión tiene clases los sábados", () => {
    mockUseHorarios.mockReturnValue({
      todas: [
        ...clases,
        {
          id: 5,
          carrera_codigo: "ISI",
          carrera_nombre: "Ingeniería en Sistemas de Información",
          plan_materia: 5,
          comision_id: 1,
          nivel: "primero",
          comision: "K1",
          materia_nombre: "Inglés",
          hora_inicio: "09:00",
          hora_fin: "11:00",
          dia_semana: "sabado",
          aula: "Aula 3",
        },
      ],
      loading: false,
      error: null,
    });

    render(<HorariosFull onClose={vi.fn()} />);

    selectCursoISI1roK1();

    expect(screen.getByText("Sáb")).toBeInTheDocument();
  });
});
