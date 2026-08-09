import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import CalendarioAdminPage from "../CalendarioAdminPage";
import * as calendarioAdminApi from "../../../shared/api/calendarioAdmin";

vi.mock("../../../shared/api/calendarioAdmin", () => ({
  fetchEventosCalendario: vi.fn(),
  bulkSaveCalendario: vi.fn(),
}));

vi.mock("../../components/calendario/AnnualCalendarGrid", () => ({
  default: ({
    year,
    onToggleDay,
    onRangeSelect,
  }: {
    year: number;
    onToggleDay: (date: string) => void;
    onRangeSelect: (from: string, to: string) => void;
  }) => (
    <div data-testid="mock-calendar">
      <span data-testid="calendar-year">{year}</span>
      <button onClick={() => onToggleDay("2026-03-15")}>toggle day</button>
      <button onClick={() => onRangeSelect("2026-06-01", "2026-06-15")}>
        select range
      </button>
    </div>
  ),
}));

vi.mock("../../components/calendario/EventTypeSelector", () => ({
  default: ({
    selected,
    onSelect,
  }: {
    selected: string | null;
    onSelect: (tipo: string | null) => void;
  }) => (
    <div data-testid="mock-event-type-selector">
      <span data-testid="selected-tipo">{selected ?? "none"}</span>
      <button onClick={() => onSelect("inicio_cuatrimestre")}>
        select inicio
      </button>
      <button onClick={() => onSelect("mesa_examen")}>select mesa</button>
      <button onClick={() => onSelect(null)}>deselect</button>
    </div>
  ),
}));

vi.mock("../../components/calendario/EventSummary", () => ({
  default: ({
    events,
    onDeleteEvent,
  }: {
    events: { tipo: string; fecha_inicio: string }[];
    onDeleteEvent: (index: number) => void;
  }) => (
    <div data-testid="mock-event-summary">
      <span data-testid="event-count">{events.length}</span>
      {events.map((ev, i) => (
        <div key={i} data-testid={`event-${i}`}>
          <span>{ev.tipo}</span>
          <button onClick={() => onDeleteEvent(i)}>delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../components/calendario/SaveConfirmationModal", () => ({
  default: ({
    open,
    eventCount,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    eventCount: number;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    open ? (
      <div data-testid="mock-save-modal">
        <span>Guardar {eventCount} eventos</span>
        <button onClick={onConfirm}>confirm save</button>
        <button onClick={onCancel}>cancel save</button>
      </div>
    ) : null,
}));

const mockFetchEventos = vi.mocked(calendarioAdminApi.fetchEventosCalendario);
const mockBulkSave = vi.mocked(calendarioAdminApi.bulkSaveCalendario);

describe("CalendarioAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEventos.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título y subtítulo", async () => {
    render(<CalendarioAdminPage />);
    expect(screen.getByText("Calendario Académico")).toBeInTheDocument();
    expect(screen.getByText(/Marcá los días y rangos/)).toBeInTheDocument();
  });

  it("carga eventos existentes al montar", async () => {
    mockFetchEventos.mockResolvedValue([
      {
        id: 1,
        titulo: "Inicio cuatri",
        tipo: "inicio_cuatrimestre",
        fecha_inicio: "2026-03-01",
        fecha_fin: null,
        todo_el_dia: true,
        es_rango: false,
        color: "",
        descripcion: "",
        documento_fuente: null,
        documento_fuente_url: null,
        creado_en: "2026-01-01T00:00:00Z",
        actualizado_en: "2026-01-01T00:00:00Z",
      },
    ]);
    render(<CalendarioAdminPage />);
    await waitFor(() => {
      expect(mockFetchEventos).toHaveBeenCalled();
    });
    expect(screen.getByTestId("event-count")).toHaveTextContent("1");
  });

  it("muestra el selector de año", async () => {
    render(<CalendarioAdminPage />);
    expect(
      screen.getByDisplayValue(String(new Date().getFullYear())),
    ).toBeInTheDocument();
  });

  it("muestra el botón de guardar deshabilitado sin eventos", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");
    const btn = screen.getByRole("button", { name: /Guardar/ });
    expect(btn).toBeDisabled();
  });

  it("agrega un evento de tipo día al hacer toggle", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select inicio"));
    expect(screen.getByTestId("selected-tipo")).toHaveTextContent(
      "inicio_cuatrimestre",
    );

    fireEvent.click(screen.getByText("toggle day"));
    expect(screen.getByTestId("event-count")).toHaveTextContent("1");
  });

  it("agrega un evento de tipo rango al seleccionar rango", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select mesa"));
    expect(screen.getByTestId("selected-tipo")).toHaveTextContent(
      "mesa_examen",
    );

    fireEvent.click(screen.getByText("select range"));
    expect(screen.getByTestId("event-count")).toHaveTextContent("1");
  });

  it("elimina un evento del resumen", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select inicio"));
    fireEvent.click(screen.getByText("toggle day"));
    expect(screen.getByTestId("event-count")).toHaveTextContent("1");

    fireEvent.click(screen.getByTestId("event-0").querySelector("button")!);
    expect(screen.getByTestId("event-count")).toHaveTextContent("0");
  });

  it("abre modal de confirmación al guardar", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select inicio"));
    fireEvent.click(screen.getByText("toggle day"));

    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    expect(screen.getByTestId("mock-save-modal")).toBeInTheDocument();
  });

  it("guarda eventos al confirmar", async () => {
    mockBulkSave.mockResolvedValue({ guardados: 1, ids: [1] });
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select inicio"));
    fireEvent.click(screen.getByText("toggle day"));
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    fireEvent.click(screen.getByText("confirm save"));

    await waitFor(() => {
      expect(mockBulkSave).toHaveBeenCalled();
    });
  });

  it("cierra modal al cancelar guardado", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select inicio"));
    fireEvent.click(screen.getByText("toggle day"));
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    expect(screen.getByTestId("mock-save-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("cancel save"));
    await waitFor(() => {
      expect(screen.queryByTestId("mock-save-modal")).not.toBeInTheDocument();
    });
  });

  it("muestra error al cargar eventos", async () => {
    mockFetchEventos.mockRejectedValue(new Error("Error de red"));
    render(<CalendarioAdminPage />);
    expect(
      await screen.findByText("Error al cargar el calendario"),
    ).toBeInTheDocument();
  });

  it("muestra error al guardar", async () => {
    mockBulkSave.mockRejectedValue(new Error("Error al guardar"));
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    fireEvent.click(screen.getByText("select inicio"));
    fireEvent.click(screen.getByText("toggle day"));
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    fireEvent.click(screen.getByText("confirm save"));

    expect(
      await screen.findByText("Error al guardar los eventos."),
    ).toBeInTheDocument();
  });

  it("cambia el año y recarga eventos", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");

    const select = screen.getByDisplayValue(String(new Date().getFullYear()));
    fireEvent.change(select, { target: { value: "2025" } });

    await waitFor(() => {
      expect(mockFetchEventos).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId("calendar-year")).toHaveTextContent("2025");
  });

  it("el layout tiene calendario a la izquierda y resumen a la derecha", async () => {
    render(<CalendarioAdminPage />);
    await screen.findByTestId("event-count");
    const calendar = screen.getByTestId("mock-calendar");
    const summary = screen.getByTestId("mock-event-summary");
    expect(calendar.compareDocumentPosition(summary)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
