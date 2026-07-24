import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import DataFormModal, { type FormField } from "../DataFormModal";

const mockFields: FormField[] = [
  { name: "nombre", label: "Nombre", type: "text", required: true },
  { name: "descripcion", label: "Descripción", type: "textarea" },
  { name: "tipo", label: "Tipo", type: "select", options: [
    { value: "a", label: "Opción A" },
    { value: "b", label: "Opción B" },
  ]},
];

describe("DataFormModal", () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título y los campos", () => {
    render(
      <DataFormModal
        title="Crear carrera"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Crear carrera")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
  });

  it("muestra asterisco en campos requeridos", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    const requiredIndicator = screen.getByText("*");
    expect(requiredIndicator).toBeInTheDocument();
  });

  it("renderiza input de texto para campos type text", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    const input = screen.getByRole("textbox", { name: /nombre/i });
    expect(input).toBeInTheDocument();
  });

  it("renderiza select para campos type select", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renderiza textarea para campos type textarea", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    const textareas = screen.getAllByRole("textbox");
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });

  it("cierra el modal al hacer click en Cancelar", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("cierra el modal con Escape", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("cierra al hacer click en el backdrop", () => {
    const { container } = render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    const backdrop = container.querySelector(".fixed.inset-0");
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("llama a onSubmit con los datos del formulario", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "ISI" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Guardar");
    expect(mockOnSubmit).toHaveBeenCalledWith({
      nombre: "ISI",
      descripcion: "",
      tipo: "",
    });
  });

  it("muestra estado de carga durante el envío", async () => {
    let resolveSubmit: () => void;
    mockOnSubmit.mockImplementation(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "ISI" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Guardando...");
    expect(screen.getByText("Guardando...")).toBeInTheDocument();
    const submitBtn = screen.getByRole("button", { name: "Guardando..." });
    expect(submitBtn).toBeDisabled();
  });

  it("muestra error cuando onSubmit falla", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Error de red"));
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "ISI" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    expect(await screen.findByText("Error de red")).toBeInTheDocument();
  });

  it("muestra error genérico cuando el error no es Error", async () => {
    mockOnSubmit.mockRejectedValue("string error");
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "ISI" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    expect(
      await screen.findByText("Error al guardar los datos"),
    ).toBeInTheDocument();
  });

  it("renderiza con datos iniciales para edición", () => {
    render(
      <DataFormModal
        title="Editar"
        fields={mockFields}
        initialData={{ nombre: "ISI", tipo: "a" }}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByRole("textbox", { name: /nombre/i })).toHaveValue("ISI");
  });

  it("cierra el backdrop sin cerrar el modal al hacer click en un hijo", () => {
    render(
      <DataFormModal
        title="Crear"
        fields={mockFields}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />,
    );
    const modal = screen.getByText("Crear");
    fireEvent.click(modal);
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
