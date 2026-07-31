import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import VincularTotem from "../VincularTotem";

const { mockFetchEspacios, mockVincularTotem, mockNavigate, mockRefresh } =
  vi.hoisted(() => ({
    mockFetchEspacios: vi.fn(),
    mockVincularTotem: vi.fn(),
    mockNavigate: vi.fn(),
    mockRefresh: vi.fn(),
  }));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: [],
    selectedId: "",
    setSelectedId: vi.fn(),
    selectedTotem: undefined,
    refreshTotems: mockRefresh,
  }),
}));

vi.mock("../../../shared/api/totems", () => ({
  fetchEspacios: mockFetchEspacios,
  vincularTotem: mockVincularTotem,
}));

describe("VincularTotem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEspacios.mockResolvedValue([
      { id: 1, nombre: "Hall Central", tipo: "hall", piso: 0 },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el formulario de vinculación", async () => {
    render(<VincularTotem />);
    await screen.findByRole("option", { name: /Hall Central/ });
    expect(screen.getByLabelText("Código de vinculación")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del tótem")).toBeInTheDocument();
    expect(screen.getByLabelText("Espacio")).toBeInTheDocument();
  });

  it("vincula el tótem, refresca la lista y navega al admin", async () => {
    mockVincularTotem.mockResolvedValue({ id: 3 });
    mockRefresh.mockResolvedValue(undefined);

    render(<VincularTotem />);

    await screen.findByRole("option", { name: /Hall Central/ });

    fireEvent.change(screen.getByLabelText("Código de vinculación"), {
      target: { value: "34735" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del tótem"), {
      target: { value: "Tótem Hall" },
    });
    fireEvent.change(screen.getByLabelText("Espacio"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Vincular tótem" }));

    expect(
      await screen.findByText("Tótem vinculado exitosamente"),
    ).toBeInTheDocument();
    expect(mockVincularTotem).toHaveBeenCalledWith({
      codigo_vinculacion: "34735",
      nombre: "Tótem Hall",
      espacio_id: 1,
    });
    expect(mockRefresh).toHaveBeenCalled();

    await waitFor(
      () =>
        expect(mockNavigate).toHaveBeenCalledWith("/admin/", { replace: true }),
      { timeout: 3000 },
    );
  });

  it("muestra el error y no navega cuando la vinculación falla", async () => {
    mockVincularTotem.mockRejectedValue(new Error("Código inválido"));

    render(<VincularTotem />);

    await screen.findByRole("option", { name: /Hall Central/ });

    fireEvent.change(screen.getByLabelText("Código de vinculación"), {
      target: { value: "99999" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del tótem"), {
      target: { value: "Tótem Hall" },
    });
    fireEvent.change(screen.getByLabelText("Espacio"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Vincular tótem" }));

    expect(await screen.findByText("Código inválido")).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
