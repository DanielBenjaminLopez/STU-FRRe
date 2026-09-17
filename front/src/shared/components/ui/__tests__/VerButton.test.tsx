import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import VerButton from "../VerButton";

describe("VerButton Component", () => {
  beforeEach(() => {
    cleanup();
  });
  it("renderiza con el texto por defecto 'Ver horario completo'", () => {
    render(<VerButton />);
    expect(
      screen.getByRole("button", { name: "Ver horario completo" }),
    ).toBeInTheDocument();
  });

  it("renderiza con texto personalizado cuando se pasa children", () => {
    render(<VerButton>Ver todo</VerButton>);
    expect(
      screen.getByRole("button", { name: "Ver todo" }),
    ).toBeInTheDocument();
  });

  it("dispara evento onClick al hacer clic", () => {
    const handleClick = vi.fn();
    render(<VerButton onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
