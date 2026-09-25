import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import EventosPage from "../EventosPage";
import * as eventosApi from "../../../features/noticias/api/eventos";

vi.mock("sileo", () => ({
  sileo: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { sileo } from "sileo";

vi.mock("../../../features/noticias/api/eventos", () => ({
  fetchEventos: vi.fn(),
  createEvento: vi.fn(),
  updateEvento: vi.fn(),
  deleteEvento: vi.fn(),
  toggleDestacadoEvento: vi.fn(),
  uploadEventoImagen: vi.fn(),
  TIPOS_EVENTO: [
    { value: "taller", label: "Taller" },
    { value: "curso", label: "Curso" },
    { value: "recreativo", label: "Recreativo" },
    { value: "charla", label: "Charla" },
  ],
}));

vi.mock("../../components/DataTable", () => ({
  default: ({
    data,
    columns,
    onEdit,
    onDelete,
    isLoading,
    searchPlaceholder,
  }: {
    data: unknown[];
    columns: {
      key: string;
      label: string;
      render?: (val: unknown, row: unknown) => React.ReactNode;
    }[];
    onEdit: (row: unknown) => void;
    onDelete: (row: unknown) => void;
    isLoading: boolean;
    searchPlaceholder: string;
  }) => (
    <div data-testid="mock-datatable">
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="placeholder">{searchPlaceholder}</span>
      <span data-testid="count">{data.length}</span>
      {data.map((row, i) => {
        const item = row as Record<string, unknown>;
        return (
          <div key={i} data-testid={`row-${i}`}>
            <span>{String(item.titulo)}</span>
            {columns?.map((col) => (
              <div key={col.key} data-testid={`col-${col.key}-${i}`}>
                {col.render
                  ? col.render(item[col.key], item)
                  : String(item[col.key] ?? "")}
              </div>
            ))}
            <button onClick={() => onEdit(item)}>edit</button>
            <button onClick={() => onDelete(item)}>delete</button>
          </div>
        );
      })}
    </div>
  ),
}));

const mockFetchEventos = vi.mocked(eventosApi.fetchEventos);
const mockCreateEvento = vi.mocked(eventosApi.createEvento);
const mockDeleteEvento = vi.mocked(eventosApi.deleteEvento);
const mockToggleDestacadoEvento = vi.mocked(eventosApi.toggleDestacadoEvento);

const EVENTOS: eventosApi.Evento[] = [
  {
    id: 1,
    titulo: "Hackathon 2026",
    tipo: "recreativo",
    tipo_otro: "",
    descripcion: "Competencia de programación",
    fecha_hora_inicio: "2026-09-15T09:00:00Z",
    fecha_hora_fin: "2026-09-15T18:00:00Z",
    imagen_url: "https://example.com/hackathon.jpg",
    espacio: "Aula Magna",
    espacio_nombre: "Aula Magna",
    destacado: false,
  },
  {
    id: 2,
    titulo: "Taller de Git",
    tipo: "taller",
    tipo_otro: "",
    descripcion: "Taller práctico",
    fecha_hora_inicio: "2026-09-20T14:00:00Z",
    fecha_hora_fin: "2026-09-20T16:00:00Z",
    imagen_url: "",
    espacio: null,
    espacio_nombre: null,
    destacado: true,
  },
];

describe("EventosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEventos.mockResolvedValue(EVENTOS);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título y subtítulo", async () => {
    render(<EventosPage />);
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Gestión de eventos, talleres, cursos y actividades institucionales",
      ),
    ).toBeInTheDocument();
  });

  it("carga y muestra los eventos en la tabla", async () => {
    render(<EventosPage />);
    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
    expect(mockFetchEventos).toHaveBeenCalled();
  });

  it("muestra el botón de crear evento", async () => {
    render(<EventosPage />);
    await screen.findByTestId("count");
    expect(
      screen.getByRole("button", { name: /Crear evento/ }),
    ).toBeInTheDocument();
  });

  it("abre modal de crear evento al hacer click", async () => {
    render(<EventosPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByRole("button", { name: "Crear evento" }));
    expect(
      screen.getByRole("heading", { name: "Crear evento" }),
    ).toBeInTheDocument();
  });

  it("crea un evento al enviar el formulario", async () => {
    mockCreateEvento.mockResolvedValue({} as never);
    render(<EventosPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByRole("button", { name: "Crear evento" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Crear evento" }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Título/i), {
      target: { value: "Nuevo Torneo" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha y hora inicio/i), {
      target: { value: "2026-10-01T10:00" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha y hora fin/i), {
      target: { value: "2026-10-01T12:00" },
    });

    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(mockCreateEvento).toHaveBeenCalled();
    });
    expect(sileo.success).toHaveBeenCalledWith({
      title: "Evento creado",
    });
  });

  it("permite destacar un evento con el botón de estrella", async () => {
    mockToggleDestacadoEvento.mockResolvedValue({
      ...EVENTOS[0],
      destacado: true,
    });

    render(<EventosPage />);
    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });

    const starBtn = screen.getByRole("button", { name: "Destacar evento" });
    fireEvent.click(starBtn);

    await waitFor(() => {
      expect(mockToggleDestacadoEvento).toHaveBeenCalledWith(1);
    });
    expect(sileo.success).toHaveBeenCalledWith({
      title: "Evento destacado en el tótem",
    });
  });

  it("elimina un evento tras confirmar", async () => {
    render(<EventosPage />);
    await waitFor(() => {
      expect(screen.getAllByText("Hackathon 2026").length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText("delete");
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/¿Estás seguro/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Eliminar"));

    await waitFor(() => {
      expect(mockDeleteEvento).toHaveBeenCalledWith(1);
    });
    expect(sileo.success).toHaveBeenCalledWith({
      title: "Evento eliminado",
    });
  });

  it("cierra modal con Escape", async () => {
    render(<EventosPage />);
    await screen.findByTestId("count");
    fireEvent.click(screen.getByRole("button", { name: "Crear evento" }));
    expect(
      screen.getByRole("heading", { name: "Crear evento" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("heading", { name: "Crear evento" }), {
      key: "Escape",
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Crear evento" }),
      ).not.toBeInTheDocument();
    });
  });

  it("muestra error al fallar la carga de eventos", async () => {
    mockFetchEventos.mockRejectedValue(new Error("Error de servidor"));
    render(<EventosPage />);
    await waitFor(() => {
      expect(sileo.error).toHaveBeenCalledWith({
        title: "Error al cargar eventos",
        description: "Error de servidor",
      });
    });
  });
});
