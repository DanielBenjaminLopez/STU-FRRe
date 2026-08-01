import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import PageHeader from "../PageHeader";

describe("PageHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza el título", () => {
    render(<PageHeader title="Carreras" />);
    expect(screen.getByText("Carreras")).toBeInTheDocument();
  });

  it("renderiza el subtítulo cuando se provee", () => {
    render(<PageHeader title="Carreras" subtitle="Gestión de carreras" />);
    expect(screen.getByText("Gestión de carreras")).toBeInTheDocument();
  });

  it("no renderiza subtítulo cuando no se provee", () => {
    render(<PageHeader title="Carreras" />);
    expect(screen.queryByText("Gestión de carreras")).not.toBeInTheDocument();
  });

  it("muestra el botón de crear cuando se provee onCreate", () => {
    const onCreate = vi.fn();
    render(<PageHeader title="Carreras" onCreate={onCreate} />);
    expect(screen.getByText("Crear")).toBeInTheDocument();
  });

  it("llama a onCreate al hacer click en el botón", () => {
    const onCreate = vi.fn();
    render(<PageHeader title="Carreras" onCreate={onCreate} />);
    fireEvent.click(screen.getByText("Crear"));
    expect(onCreate).toHaveBeenCalled();
  });

  it("usa createLabel personalizado", () => {
    render(
      <PageHeader
        title="Carreras"
        onCreate={vi.fn()}
        createLabel="Nueva carrera"
      />,
    );
    expect(screen.getByText("Nueva carrera")).toBeInTheDocument();
  });

  it("no muestra botón de crear cuando no se provee onCreate", () => {
    render(<PageHeader title="Carreras" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tiene el layout correcto con flex justify-between", () => {
    const { container } = render(<PageHeader title="Test" />);
    const root = container.firstElementChild;
    expect(root).toHaveClass("flex", "items-center", "justify-between");
  });
});
