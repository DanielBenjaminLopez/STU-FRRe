import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EventTypeSelector from "../EventTypeSelector";

describe("EventTypeSelector", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza todas las opciones de tipos de eventos", () => {
    render(<EventTypeSelector selected={null} onSelect={() => {}} />);
    expect(screen.getByText("Inicio Cuatrimestre")).toBeInTheDocument();
    expect(screen.getByText("Fin Cuatrimestre")).toBeInTheDocument();
    expect(screen.getByText("Mesa de Examen")).toBeInTheDocument();
    expect(screen.getByText("Receso Invernal")).toBeInTheDocument();
    expect(screen.getByText("Feriado")).toBeInTheDocument();
  });

  it("las opciones tienen la clase cursor-pointer", () => {
    render(<EventTypeSelector selected={null} onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toHaveClass("cursor-pointer");
    });
  });

  it("llama a onSelect con el tipo correspondiente o null si ya estaba seleccionado", () => {
    const handleSelect = vi.fn();
    const { rerender } = render(
      <EventTypeSelector selected={null} onSelect={handleSelect} />,
    );

    const mesaBtn = screen.getByText("Mesa de Examen").closest("button")!;
    fireEvent.click(mesaBtn);
    expect(handleSelect).toHaveBeenCalledWith("mesa_examen");

    rerender(
      <EventTypeSelector selected="mesa_examen" onSelect={handleSelect} />,
    );
    fireEvent.click(mesaBtn);
    expect(handleSelect).toHaveBeenCalledWith(null);
  });
});
