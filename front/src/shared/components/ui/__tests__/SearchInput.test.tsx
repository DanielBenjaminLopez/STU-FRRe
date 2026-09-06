import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SearchInput from "../SearchInput";

describe("SearchInput", () => {
  afterEach(() => {
    cleanup();
  });
  it("renderiza correctamente con placeholder y valor", () => {
    render(
      <SearchInput
        value="Prueba"
        onChange={() => {}}
        placeholder="Buscar elemento..."
      />,
    );
    const input = screen.getByPlaceholderText("Buscar elemento...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Prueba");
  });

  it("llama a onChange al escribir", () => {
    const handleChange = vi.fn();
    render(
      <SearchInput value="" onChange={handleChange} placeholder="Buscar..." />,
    );
    const input = screen.getByPlaceholderText("Buscar...");
    fireEvent.change(input, { target: { value: "hola" } });
    expect(handleChange).toHaveBeenCalledWith("hola");
  });

  it("muestra el botón de limpiar solo cuando hay valor", () => {
    const { rerender } = render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.queryByLabelText("Limpiar búsqueda")).not.toBeInTheDocument();

    rerender(<SearchInput value="algo" onChange={() => {}} />);
    expect(screen.getByLabelText("Limpiar búsqueda")).toBeInTheDocument();
  });

  it("limpia el input y llama a onClear al hacer click en el botón de limpiar", () => {
    const handleChange = vi.fn();
    const handleClear = vi.fn();
    render(
      <SearchInput
        value="texto"
        onChange={handleChange}
        onClear={handleClear}
      />,
    );
    const clearBtn = screen.getByLabelText("Limpiar búsqueda");
    fireEvent.click(clearBtn);
    expect(handleChange).toHaveBeenCalledWith("");
    expect(handleClear).toHaveBeenCalled();
  });

  it("deshabilita el input correctamente", () => {
    render(<SearchInput value="test" onChange={() => {}} disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(screen.queryByLabelText("Limpiar búsqueda")).not.toBeInTheDocument();
  });
});
