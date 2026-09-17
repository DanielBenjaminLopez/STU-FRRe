import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import Select from "../Select";

describe("Select Component", () => {
  beforeEach(() => {
    cleanup();
  });

  const sampleOptions = [
    { value: "", label: "Todas" },
    { value: "1K1", label: "Curso 1K1" },
    { value: "1K2", label: "Curso 1K2" },
  ];

  it("renderiza con el valor seleccionado o placeholder", () => {
    const { rerender } = render(
      <Select
        value=""
        onChange={vi.fn()}
        options={sampleOptions}
        placeholder="Todas"
      />,
    );
    expect(screen.getByRole("button", { name: /todas/i })).toBeInTheDocument();

    rerender(
      <Select
        value="1K1"
        onChange={vi.fn()}
        options={sampleOptions}
        placeholder="Todas"
      />,
    );
    expect(
      screen.getByRole("button", { name: /curso 1k1/i }),
    ).toBeInTheDocument();
  });

  it("despliega las opciones al hacer clic en el botón", () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={sampleOptions}
        placeholder="Todas"
      />,
    );

    const trigger = screen.getByRole("button", { name: /todas/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("llama a onChange con el valor seleccionado y cierra el menú", async () => {
    const handleChange = vi.fn();
    render(
      <Select
        value=""
        onChange={handleChange}
        options={sampleOptions}
        placeholder="Todas"
      />,
    );

    const trigger = screen.getByRole("button", { name: /todas/i });
    fireEvent.click(trigger);

    const option = screen.getByRole("option", { name: /curso 1k2/i });
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("1K2");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("se cierra al presionar Escape", async () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={sampleOptions}
        placeholder="Todas"
      />,
    );

    const trigger = screen.getByRole("button", { name: /todas/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("se cierra al hacer clic fuera del componente", async () => {
    render(
      <div>
        <div data-testid="outside">Afuera</div>
        <Select
          value=""
          onChange={vi.fn()}
          options={sampleOptions}
          placeholder="Todas"
        />
      </div>,
    );

    const trigger = screen.getByRole("button", { name: /todas/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("soporta array de strings directos", () => {
    const stringOptions = ["Todas", "Comisión 1", "Comisión 2"];
    const handleChange = vi.fn();

    render(
      <Select value="Todas" onChange={handleChange} options={stringOptions} />,
    );

    const trigger = screen.getByRole("button", { name: /todas/i });
    fireEvent.click(trigger);

    const option = screen.getByRole("option", { name: /comisión 1/i });
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("Comisión 1");
  });

  it("aplica estilos de colorVariant gray y green correctamente", () => {
    const { rerender } = render(
      <Select
        value="1K1"
        onChange={vi.fn()}
        options={sampleOptions}
        colorVariant="gray"
      />,
    );

    const triggerGray = screen.getByRole("button", { name: /curso 1k1/i });
    fireEvent.click(triggerGray);
    const selectedGray = screen.getByRole("option", { name: /curso 1k1/i });
    expect(selectedGray).toHaveClass("bg-gray-100");

    rerender(
      <Select
        value="1K1"
        onChange={vi.fn()}
        options={sampleOptions}
        colorVariant="green"
      />,
    );
    const selectedGreen = screen.getByRole("option", { name: /curso 1k1/i });
    expect(selectedGreen).toHaveClass("bg-green-100/80");
  });

  it("aplica clase de alineación center por defecto y cuando align='center'", () => {
    render(<Select value="1K1" onChange={vi.fn()} options={sampleOptions} />);

    const trigger = screen.getByRole("button", { name: /curso 1k1/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox").parentElement).toHaveClass("left-1/2");

    cleanup();

    render(
      <Select
        value="1K1"
        onChange={vi.fn()}
        options={sampleOptions}
        align="left"
      />,
    );
    const triggerLeft = screen.getByRole("button", { name: /curso 1k1/i });
    fireEvent.click(triggerLeft);
    expect(screen.getByRole("listbox").parentElement).toHaveClass("left-0");
  });
});
