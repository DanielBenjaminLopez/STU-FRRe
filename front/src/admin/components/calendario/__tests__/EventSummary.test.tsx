import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EventSummary from "../EventSummary";

describe("EventSummary", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra mensaje vacío si no hay eventos", () => {
    render(<EventSummary events={[]} onDeleteEvent={() => {}} />);
    expect(
      screen.getByText(/Seleccioná un tipo de evento/i),
    ).toBeInTheDocument();
  });

  it("muestra eventos con botón de cruz que tiene cursor-pointer y ejecuta onDeleteEvent", () => {
    const handleDelete = vi.fn();
    const events = [
      {
        titulo: "Mesa",
        tipo: "mesa_examen",
        fecha_inicio: "2026-09-07",
        fecha_fin: "2026-09-11",
      },
    ];

    render(<EventSummary events={events} onDeleteEvent={handleDelete} />);

    expect(screen.getByText("Mesa")).toBeInTheDocument();
    expect(screen.getByText(/07\/09 — 11\/09/)).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: "Eliminar evento" });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn).toHaveClass("cursor-pointer");

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(0);
  });
});
