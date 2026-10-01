import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import Encabezado from "../components/Encabezado";

const { mockGetCurrentTime, mockGetCurrentDate } = vi.hoisted(() => ({
  mockGetCurrentTime: vi.fn(),
  mockGetCurrentDate: vi.fn(),
}));

vi.mock("../../../shared/utils/dateTime", () => ({
  getCurrentTime: mockGetCurrentTime,
  getCurrentDate: mockGetCurrentDate,
}));

describe("Encabezado", () => {
  beforeEach(() => {
    mockGetCurrentTime.mockReturnValue("14:30");
    mockGetCurrentDate.mockReturnValue("viernes, 5 de junio de 2026");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renderiza la imagen del logo con alt y draggable correctos", () => {
    render(<Encabezado />);
    const img = screen.getByRole("img", { name: /logo/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("draggable", "false");
    expect(img).toHaveClass("shrink-0");
  });

  it("muestra la hora actual", () => {
    render(<Encabezado />);
    expect(screen.getByText("14:30")).toBeInTheDocument();
  });

  it("muestra la fecha actual", () => {
    render(<Encabezado />);
    expect(screen.getByText("viernes, 5 de junio de 2026")).toBeInTheDocument();
  });

  it("no muestra ningun saludo", () => {
    render(<Encabezado />);
    expect(screen.queryByText(/buenas tardes/i)).not.toBeInTheDocument();
  });

  it("muestra la fecha sin salto de linea y en su tamaño original", () => {
    render(<Encabezado size="lg" />);
    const date = screen.getByText("viernes, 5 de junio de 2026");
    expect(date).toHaveClass("text-2xl");
    expect(date).toHaveClass("font-normal");
    expect(date).toHaveClass("whitespace-nowrap");
    expect(date).not.toHaveClass("text-5xl");
    expect(date).not.toHaveClass("text-lg");
  });

  it("actualiza la hora mostrada mediante el intervalo", () => {
    vi.useFakeTimers();
    render(<Encabezado />);

    expect(screen.getByText("14:30")).toBeInTheDocument();

    mockGetCurrentTime.mockReturnValue("14:31");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("14:31")).toBeInTheDocument();
  });

  it("muestra la hora con el tamaño chico por defecto", () => {
    render(<Encabezado />);
    const time = screen.getByText("14:30");
    expect(time).toHaveClass("text-lg");
    expect(time).toHaveClass("rounded-4xl");
  });

  it("muestra la hora en tamaño grande y sin pastilla con size=lg", () => {
    render(<Encabezado size="lg" />);
    const time = screen.getByText("14:30");
    expect(time).toHaveClass("text-5xl");
    expect(time).toHaveClass("font-semibold");
    expect(time).not.toHaveClass("text-7xl");
    expect(time).not.toHaveClass("text-lg");
    expect(time).not.toHaveClass("rounded-4xl");
    expect(time).not.toHaveClass("bg-gray-100");
  });

  it("apila la hora sobre la fecha alineados a la derecha", () => {
    render(<Encabezado size="lg" />);
    const time = screen.getByText("14:30");
    const date = screen.getByText("viernes, 5 de junio de 2026");

    const column = time.parentElement as HTMLElement;

    expect(column).toHaveClass("flex");
    expect(column).toHaveClass("flex-col");
    expect(column).toHaveClass("items-end");

    // la hora y la fecha comparten la columna, con la fecha debajo
    expect(date.parentElement).toBe(column);
    expect(
      time.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // ninguna de las dos se parte nunca, por mas ajustado que sea el espacio
    expect(time).toHaveClass("whitespace-nowrap");
    expect(date).toHaveClass("whitespace-nowrap");

    // el logo y la columna son hermanos en la misma fila
    const row = column.parentElement as HTMLElement;
    expect(row).toHaveClass("justify-between");
    expect(row).toHaveClass("items-center");
    expect(row.firstElementChild).toBe(
      screen.getByRole("img", { name: /logo/i }),
    );
    expect(row.lastElementChild).toBe(column);
  });

  it("muestra la hora mas grande que la fecha", () => {
    render(<Encabezado size="lg" />);
    const time = screen.getByText("14:30");
    const date = screen.getByText("viernes, 5 de junio de 2026");

    expect(time).toHaveClass("text-5xl");
    expect(date).toHaveClass("text-2xl");
  });

  it("limpia el intervalo al desmontar el componente", () => {
    vi.useFakeTimers();
    const { unmount } = render(<Encabezado />);
    unmount();

    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});
