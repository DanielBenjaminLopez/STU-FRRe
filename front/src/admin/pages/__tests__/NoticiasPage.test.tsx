import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import NoticiasPage from "../NoticiasPage";
import * as noticiasApi from "../../../shared/api/noticias";

vi.mock("../../../shared/api/noticias", () => ({
  fetchFeed: vi.fn(),
  createNoticia: vi.fn(),
  updateNoticia: vi.fn(),
  deleteNoticia: vi.fn(),
  syncNoticias: vi.fn(),
  createEvento: vi.fn(),
  updateEvento: vi.fn(),
  deleteEvento: vi.fn(),
  fetchEspaciosForSelect: vi.fn(),
  TIPOS_EVENTO: [
    { value: "conferencia", label: "Conferencia" },
    { value: "taller", label: "Taller" },
  ],
}));

vi.mock("../../components/NoticiasCarousel", () => ({
  default: ({ noticias }: { noticias: unknown[] }) => (
    <div data-testid="mock-carousel">
      {noticias.length} noticias en carrusel
    </div>
  ),
}));

vi.mock("../../components/DataTable", () => ({
  default: ({
    data,
    onEdit,
    onDelete,
    isLoading,
    searchPlaceholder,
  }: {
    data: unknown[];
    onEdit: (row: unknown) => void;
    onDelete: (row: unknown) => void;
    isLoading: boolean;
    searchPlaceholder: string;
  }) => (
    <div data-testid="mock-datatable">
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="placeholder">{searchPlaceholder}</span>
      <span data-testid="count">{data.length}</span>
      {data.map((row: Record<string, unknown>, i: number) => (
        <div key={i} data-testid={`row-${i}`}>
          <span>{String(row.titulo)}</span>
          <button onClick={() => onEdit(row)}>edit</button>
          <button onClick={() => onDelete(row)}>delete</button>
        </div>
      ))}
    </div>
  ),
}));

const mockFetchFeed = vi.mocked(noticiasApi.fetchFeed);
const mockSyncNoticias = vi.mocked(noticiasApi.syncNoticias);
const mockCreateNoticia = vi.mocked(noticiasApi.createNoticia);
const mockDeleteNoticia = vi.mocked(noticiasApi.deleteNoticia);
const mockDeleteEvento = vi.mocked(noticiasApi.deleteEvento);
const mockFetchEspacios = vi.mocked(noticiasApi.fetchEspaciosForSelect);

const FEED = [
  {
    id: 1,
    titulo: "Noticia de prueba",
    tipo: "noticia",
    contenido: "Contenido",
    fecha: "2026-08-01T10:00:00Z",
    origen: "manual",
    imagen_url: null,
    enlace: null,
    fecha_expiracion: null,
  },
  {
    id: 2,
    titulo: "Evento de prueba",
    tipo: "evento",
    tipo_evento: "conferencia",
    contenido: "Desc evento",
    fecha: "2026-08-10T14:00:00Z",
    origen: "manual",
    imagen_url: "https://example.com/img.jpg",
    enlace: null,
    fecha_expiracion: null,
    espacio_nombre: "Aula 1",
  },
];

describe("NoticiasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchFeed.mockResolvedValue(FEED as never);
    mockFetchEspacios.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título y subtítulo", async () => {
    render(<NoticiasPage />);
    expect(screen.getByText("Noticias y Eventos")).toBeInTheDocument();
    expect(
      screen.getByText("Feed unificado de noticias y eventos"),
    ).toBeInTheDocument();
  });

  it("carga y muestra el feed en la tabla", async () => {
    render(<NoticiasPage />);
    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
    expect(mockFetchFeed).toHaveBeenCalled();
  });

  it("muestra los botones de acción", async () => {
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    expect(
      screen.getByRole("button", { name: /Sincronizar desde UTN/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cargar evento/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cargar noticia/ }),
    ).toBeInTheDocument();
  });

  it("muestra el carrusel cuando hay noticias", async () => {
    render(<NoticiasPage />);
    await waitFor(() => {
      expect(screen.getByTestId("mock-carousel")).toBeInTheDocument();
    });
    expect(screen.getByText("2 noticias en carrusel")).toBeInTheDocument();
  });

  it("sincroniza desde UTN al hacer click", async () => {
    mockSyncNoticias.mockResolvedValue({ detail: "Sincronizados 5 items" });
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByText("Sincronizar desde UTN"));
    await waitFor(() => {
      expect(mockSyncNoticias).toHaveBeenCalled();
    });
    expect(
      await screen.findByText("Sincronizados 5 items"),
    ).toBeInTheDocument();
  });

  it("muestra error al fallar sincronización", async () => {
    mockSyncNoticias.mockRejectedValue(new Error("Error de red"));
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByText("Sincronizar desde UTN"));
    expect(await screen.findByText("Error de red")).toBeInTheDocument();
  });

  it("abre modal de crear noticia", async () => {
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByText("Cargar noticia"));
    expect(
      screen.getByRole("heading", { name: "Crear noticia" }),
    ).toBeInTheDocument();
  });

  it("abre modal de crear evento", async () => {
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByText("Cargar evento"));
    expect(
      screen.getByRole("heading", { name: "Crear evento" }),
    ).toBeInTheDocument();
  });

  it("crea una noticia al guardar el formulario", async () => {
    mockCreateNoticia.mockResolvedValue({} as never);
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByText("Cargar noticia"));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Crear noticia" }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Título/i), {
      target: { value: "Nueva noticia" },
    });
    fireEvent.change(screen.getByLabelText(/Contenido/i), {
      target: { value: "Contenido de prueba" },
    });

    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(mockCreateNoticia).toHaveBeenCalled();
    });
  });

  it("elimina una noticia tras confirmar", async () => {
    render(<NoticiasPage />);
    await waitFor(() => {
      expect(screen.getByText("Noticia de prueba")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("delete");
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/¿Estás seguro/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));

    await waitFor(() => {
      expect(mockDeleteNoticia).toHaveBeenCalledWith(1);
    });
  });

  it("elimina un evento tras confirmar", async () => {
    render(<NoticiasPage />);
    await waitFor(() => {
      expect(screen.getByText("Evento de prueba")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("delete");
    fireEvent.click(deleteButtons[1]);

    expect(screen.getByText(/¿Estás seguro/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));

    await waitFor(() => {
      expect(mockDeleteEvento).toHaveBeenCalledWith(2);
    });
  });

  it("cierra modal con Escape", async () => {
    render(<NoticiasPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByText("Cargar noticia"));
    expect(
      screen.getByRole("heading", { name: "Crear noticia" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("heading", { name: "Crear noticia" }), {
      key: "Escape",
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Crear noticia" }),
      ).not.toBeInTheDocument();
    });
  });

  it("muestra error al cargar datos", async () => {
    mockFetchFeed.mockRejectedValue(new Error("Error de carga"));
    render(<NoticiasPage />);
    expect(await screen.findByText("Error de carga")).toBeInTheDocument();
  });
});
