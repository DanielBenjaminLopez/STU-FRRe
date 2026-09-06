import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import VincularTotemModal from "../VincularTotemModal";

const { mockVincularTotem, mockNavigate, mockRefresh, mockSetSelectedId } =
  vi.hoisted(() => ({
    mockVincularTotem: vi.fn(),
    mockNavigate: vi.fn(),
    mockRefresh: vi.fn(),
    mockSetSelectedId: vi.fn(),
  }));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    totems: [],
    selectedId: "",
    setSelectedId: mockSetSelectedId,
    selectedTotem: undefined,
    refreshTotems: mockRefresh,
  }),
}));

vi.mock("../../../shared/api/totems", () => ({
  vincularTotem: mockVincularTotem,
}));

describe("VincularTotemModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el formulario de vinculación dentro del modal", () => {
    render(<VincularTotemModal onClose={mockOnClose} />);
    expect(
      screen.getByRole("heading", { name: "Vincular nuevo tótem" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Código de vinculación")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del tótem")).toBeInTheDocument();
  });

  it("vincula el tótem, navega a plantillas con recienVinculado, setSelectedId y cierra el modal", async () => {
    mockVincularTotem.mockResolvedValue({ id: 3 });
    mockRefresh.mockResolvedValue(undefined);

    render(<VincularTotemModal onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText("Código de vinculación"), {
      target: { value: "34735" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del tótem"), {
      target: { value: "Tótem Hall" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Vincular tótem" }));

    expect(
      await screen.findByText("Tótem vinculado exitosamente"),
    ).toBeInTheDocument();
    expect(mockVincularTotem).toHaveBeenCalledWith({
      codigo_vinculacion: "34735",
      nombre: "Tótem Hall",
    });
    expect(mockSetSelectedId).toHaveBeenCalledWith("3");
    expect(mockRefresh).toHaveBeenCalled();

    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/admin/plantillas", {
          replace: true,
          state: { recienVinculado: true },
        });
      },
      { timeout: 3000 },
    );
  });

  it("muestra el error y no cierra ni navega cuando la vinculación falla", async () => {
    mockVincularTotem.mockRejectedValue(new Error("Código inválido"));

    render(<VincularTotemModal onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText("Código de vinculación"), {
      target: { value: "99999" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del tótem"), {
      target: { value: "Tótem Hall" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Vincular tótem" }));

    expect(await screen.findByText("Código inválido")).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("llama a onClose al presionar Cancelar", () => {
    render(<VincularTotemModal onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("llama a onClose al presionar Escape", () => {
    render(<VincularTotemModal onClose={mockOnClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
