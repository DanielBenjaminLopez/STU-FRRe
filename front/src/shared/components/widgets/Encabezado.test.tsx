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

  it("limpia el intervalo al desmontar el componente", () => {
    vi.useFakeTimers();
    const { unmount } = render(<Encabezado />);
    unmount();

    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});
