import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import Novedades from "../components/Novedades";
import type { ContenidoFeed } from "../api/noticias";

const mockUseNovedades = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useNoticias", () => ({
  useNovedades: mockUseNovedades,
  useNoticias: mockUseNovedades,
}));

vi.mock("../components/NovedadesFull", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="novedades-full">
      <span>Novedades Full</span>
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
    origen: "manual",
  },
  {
    id: 2,
    titulo: "Hackathon Regional 2026",
    contenido: "Inscripciones abiertas para estudiantes de ingeniería.",
    fecha: "2026-09-15T12:00:00Z",
    imagen_url: "",
    tipo: "evento",
    tipo_evento: "Hackathon",
    espacio_nombre: "Aula Magna",
  },
];

describe("Novedades", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el skeleton durante la carga", () => {
    mockUseNovedades.mockReturnValue({
      feed: [],
      loading: true,
      error: null,
    });
    const { container } = render(<Novedades />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("muestra el mensaje de error cuando falla", () => {
    mockUseNovedades.mockReturnValue({
      feed: [],
      loading: false,
      error: "Error de red",
    });
    render(<Novedades />);
    expect(screen.getByText("Error de red")).toBeInTheDocument();
  });

  it("muestra mensaje de vacío si no hay eventos", () => {
    mockUseNovedades.mockReturnValue({
      feed: [],
      loading: false,
      error: null,
    });
    render(<Novedades />);
    expect(screen.getByText("No hay eventos recientes")).toBeInTheDocument();
  });

  it("renderiza los elementos del feed con título 'Eventos'", () => {
    mockUseNovedades.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Novedades />);

    expect(screen.getAllByText("Nueva carrera de IA").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Hackathon Regional 2026").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Ver todas")).toBeInTheDocument();

    const eventBadge = screen.getAllByText("Hackathon")[0];
    expect(eventBadge.className).toContain("bg-amber-500/90");

    const espacioBadge = screen.getAllByText("Aula Magna")[0];
    expect(espacioBadge).toBeInTheDocument();
    expect(espacioBadge.className).toContain("bg-amber-200/90");
  });

  it("no renderiza los botones < y >, ni dots ni el botón 'Ver todas' si solo hay 1 noticia/evento", () => {
    mockUseNovedades.mockReturnValue({
      feed: [mockFeed[0]],
      loading: false,
      error: null,
    });
    render(<Novedades />);

    expect(
      screen.queryByRole("button", { name: /publicación anterior/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /siguiente publicación/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ir a publicación/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ver todas/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Nueva carrera de IA")).toBeInTheDocument();
  });

  it("renderiza los botones < y > y dots cuando hay más de una publicación", () => {
    mockUseNovedades.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Novedades />);

    const prevBtn = screen.getByRole("button", {
      name: /publicación anterior/i,
    });
    const nextBtn = screen.getByRole("button", {
      name: /siguiente publicación/i,
    });

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(prevBtn.className).toContain("bg-white/20");
    expect(nextBtn.className).toContain("bg-white/20");

    const dots = screen.getAllByRole("button", { name: /ir a publicación/i });
    expect(dots).toHaveLength(2);
  });

  it("permite navegar con los botones < y >", () => {
    mockUseNovedades.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Novedades />);

    const nextBtn = screen.getByRole("button", {
      name: /siguiente publicación/i,
    });
    const prevBtn = screen.getByRole("button", {
      name: /publicación anterior/i,
    });

    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
  });

  it("permite hacer clic en los dots de navegación", () => {
    mockUseNovedades.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Novedades />);

    const dots = screen.getAllByRole("button", { name: /ir a publicación/i });
    expect(dots).toHaveLength(2);

    fireEvent.click(dots[1]);
    expect(dots[1].className).toContain("bg-white");
  });

  it("auto-rota cada 10 segundos", () => {
    mockUseNovedades.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Novedades />);

    const dots = screen.getAllByRole("button", { name: /ir a publicación/i });
    expect(dots[0].className).toContain("bg-white");

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(dots[0].className).toContain("bg-white");

    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });

  it("abre NovedadesFull al hacer clic en 'Ver todas'", () => {
    mockUseNovedades.mockReturnValue({
      feed: mockFeed,
      loading: false,
      error: null,
    });
    render(<Novedades />);

    fireEvent.click(screen.getByText("Ver todas"));
    expect(screen.getByTestId("novedades-full")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cerrar"));
    expect(screen.queryByTestId("novedades-full")).not.toBeInTheDocument();
  });
});
