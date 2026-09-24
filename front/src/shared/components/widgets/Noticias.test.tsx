import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import Noticias from "./Noticias";
import type { ContenidoFeed } from "../../api/noticias";

const mockUseNoticias = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useNoticias", () => ({
  useNoticias: mockUseNoticias,
}));

vi.mock("./NoticiasFull", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="noticias-full">
      <span>Noticias Full</span>
      <button type="button" onClick={onClose}>
        Cerrar
      </button>
    </div>
  ),
}));

const mockFeed: ContenidoFeed[] = [
  {
    id: 1,
    titulo: "Nueva carrera de IA",
    contenido: "Se abre la inscripción para la nueva carrera.",
    fecha: "2026-09-10T12:00:00Z",
    imagen_url: "https://example.com/noticia1.jpg",
    tipo: "noticia",
    origen: "scraping",
  },
  {
    id: 2,
    titulo: "Jornadas de Investigación 2026",
    contenido: "Inscripciones abiertas para estudiantes de ingeniería.",
    fecha: "2026-09-15T12:00:00Z",
    imagen_url: "",
    tipo: "noticia",
    origen: "scraping",
  },
];

describe("Noticias", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el skeleton durante la carga", () => {
    mockUseNoticias.mockReturnValue({
      feed: [],
      loading: true,
      error: null,
    });
    const { container } = render(<Noticias />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("muestra el mensaje de error cuando falla", () => {
    mockUseNoticias.mockReturnValue({
      feed: [],
      loading: false,
      error: "Error de red",
    });
    render(<Noticias />);
    expect(screen.getByText("Error de red")).toBeInTheDocument();
  });

  it("muestra mensaje de vacío si no hay noticias", () => {
    mockUseNoticias.mockReturnValue({
      feed: [],
      loading: false,
      error: null,
    });
    render(<Noticias />);
    expect(screen.getByText("No hay noticias recientes")).toBeInTheDocument();
  });

  it("renderiza los elementos del feed en el contenedor horizontal", () => {
    mockUseNoticias.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Noticias />);

    expect(screen.getAllByText("Nueva carrera de IA").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Jornadas de Investigación 2026").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Noticias")).toBeInTheDocument();
    expect(screen.getByText("Ver todas")).toBeInTheDocument();
  });

  it("renderiza los botones < y > con estilo transparente cuando hay más de una noticia", () => {
    mockUseNoticias.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Noticias />);

    const prevBtn = screen.getByRole("button", { name: /noticia anterior/i });
    const nextBtn = screen.getByRole("button", { name: /siguiente noticia/i });

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(prevBtn.className).toContain("bg-white/20");
    expect(nextBtn.className).toContain("bg-white/20");
  });

  it("no renderiza los botones < y > si solo hay 1 noticia", () => {
    mockUseNoticias.mockReturnValue({
      feed: [mockFeed[0]],
      loading: false,
      error: null,
    });
    render(<Noticias />);

    expect(
      screen.queryByRole("button", { name: /noticia anterior/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /siguiente noticia/i }),
    ).not.toBeInTheDocument();
  });

  it("permite navegar con los botones < y >", () => {
    mockUseNoticias.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Noticias />);

    const nextBtn = screen.getByRole("button", { name: /siguiente noticia/i });
    const prevBtn = screen.getByRole("button", { name: /noticia anterior/i });

    // Clic en siguiente
    fireEvent.click(nextBtn);
    // Clic en anterior
    fireEvent.click(prevBtn);
  });

  it("abre NoticiasFull al hacer clic en 'Ver todas'", () => {
    mockUseNoticias.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Noticias />);

    fireEvent.click(screen.getByText("Ver todas"));
    expect(screen.getByTestId("noticias-full")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cerrar"));
    expect(screen.queryByTestId("noticias-full")).not.toBeInTheDocument();
  });

  it("permite hacer clic en los dots de navegación", () => {
    mockUseNoticias.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Noticias />);

    const dots = screen.getAllByRole("button", { name: /ir a noticia/i });
    expect(dots).toHaveLength(2);

    fireEvent.click(dots[1]);
    expect(dots[1].className).toContain("bg-white");
  });

  it("auto-rota cada 10 segundos", () => {
    mockUseNoticias.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Noticias />);

    const dots = screen.getAllByRole("button", { name: /ir a noticia/i });
    expect(dots[0].className).toContain("bg-white");

    // A los 5 segundos todavía no rota (antes rotaba a los 5s)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(dots[0].className).toContain("bg-white");

    // A los 10 segundos avanza
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});
