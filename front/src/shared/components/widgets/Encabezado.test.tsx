import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import Encabezado from "./Encabezado";

const { mockGetCurrentTime, mockGetCurrentDate, mockGetGreeting } = vi.hoisted(
  () => ({
    mockGetCurrentTime: vi.fn(),
    mockGetCurrentDate: vi.fn(),
    mockGetGreeting: vi.fn(),
  }),
);

vi.mock("../../utils/dateTime", () => ({
  getCurrentTime: mockGetCurrentTime,
  getCurrentDate: mockGetCurrentDate,
  getGreeting: mockGetGreeting,
}));

describe("Encabezado", () => {
  beforeEach(() => {
    mockGetCurrentTime.mockReturnValue("14:30");
    mockGetCurrentDate.mockReturnValue("viernes, 5 de junio de 2026");
    mockGetGreeting.mockReturnValue("¡Buenas tardes!");
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

  it("muestra el saludo", () => {
    render(<Encabezado />);
    expect(screen.getByText("¡Buenas tardes!")).toBeInTheDocument();
  });

  it("muestra la fecha actual", () => {
    render(<Encabezado />);
    expect(screen.getByText("viernes, 5 de junio de 2026")).toBeInTheDocument();
  });

  it("muestra la fecha sin salto de linea y en tamaño intermedio", () => {
    render(<Encabezado size="lg" />);
    const date = screen.getByText("viernes, 5 de junio de 2026");
    expect(date).toHaveClass("text-2xl");
    expect(date).toHaveClass("whitespace-nowrap");
    expect(date).not.toHaveClass("text-3xl");
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

  it("muestra la hora grande y sin pastilla con size=lg", () => {
    render(<Encabezado size="lg" />);
    const time = screen.getByText("14:30");
    expect(time).toHaveClass("text-7xl");
    expect(time).toHaveClass("font-semibold");
    expect(time).not.toHaveClass("text-5xl");
    expect(time).not.toHaveClass("text-lg");
    expect(time).not.toHaveClass("rounded-4xl");
    expect(time).not.toHaveClass("bg-gray-100");
  });

  it("coloca la fecha debajo del saludo y la hora a su derecha", () => {
    render(<Encabezado size="lg" />);
    const greeting = screen.getByText("¡Buenas tardes!");
    const date = screen.getByText("viernes, 5 de junio de 2026");
    const time = screen.getByText("14:30");

    const row = time.parentElement as HTMLElement;
    const column = greeting.parentElement as HTMLElement;

    expect(row).toHaveClass("flex");
    expect(row).toHaveClass("items-center");
    expect(column).toBe(row.firstElementChild);
    expect(time).toBe(row.lastElementChild);

    // el saludo y la fecha comparten la columna, con la fecha debajo
    expect(greeting.parentElement).toBe(date.parentElement);
    expect(
      greeting.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("limpia el intervalo al desmontar el componente", () => {
    vi.useFakeTimers();
    const { unmount } = render(<Encabezado />);
    unmount();

    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});
