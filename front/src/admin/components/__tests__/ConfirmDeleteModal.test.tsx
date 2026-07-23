import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

describe("ConfirmDeleteModal", () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título", () => {
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Eliminar carrera")).toBeInTheDocument();
  });

  it("muestra el nombre del elemento a eliminar", () => {
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="Ingeniería en Sistemas"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Ingeniería en Sistemas")).toBeInTheDocument();
  });

  it("muestra el mensaje de confirmación", () => {
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/¿Estás seguro/)).toBeInTheDocument();
    expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
  });

  it("muestra los botones Cancelar y Eliminar", () => {
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });

  it("llama a onClose al hacer click en Cancelar", () => {
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("llama a onConfirm al hacer click en Eliminar", async () => {
    mockOnConfirm.mockResolvedValue(undefined);
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it("cierra el modal después de confirmar", async () => {
    mockOnConfirm.mockResolvedValue(undefined);
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("cierra el modal al hacer click en el backdrop", () => {
    const { container } = render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    const backdrop = container.querySelector(".fixed.inset-0");
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("el botón Eliminar tiene estilo rojo", () => {
    render(
      <ConfirmDeleteModal
        title="Eliminar carrera"
        itemName="ISI"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />,
    );
    const btn = screen.getByRole("button", { name: "Eliminar" });
    expect(btn).toHaveClass("bg-red-500");
  });
});
