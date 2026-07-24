import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import DataTable, { type Column } from "../DataTable";

interface TestRow {
  id: number;
  nombre: string;
  tipo: string;
}

const columns: Column<TestRow>[] = [
  { key: "nombre", label: "Nombre" },
  { key: "tipo", label: "Tipo" },
];

const mockData: TestRow[] = [
  { id: 1, nombre: "Alfa", tipo: "A" },
  { id: 2, nombre: "Bravo", tipo: "B" },
  { id: 3, nombre: "Charlie", tipo: "A" },
];

describe("DataTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza el título con la cantidad de elementos", () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText("3 elementos")).toBeInTheDocument();
  });

  it("muestra mensaje vacío cuando no hay datos", () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText("No se encontraron elementos")).toBeInTheDocument();
  });

  it("muestra las filas de datos", () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renderiza el encabezado de columnas", () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
  });

  it("filtra filas por búsqueda", () => {
    render(<DataTable data={mockData} columns={columns} />);
    const input = screen.getByPlaceholderText("Buscar...");
    fireEvent.change(input, { target: { value: "bravo" } });
    expect(screen.getByText("Bravo")).toBeInTheDocument();
    expect(screen.queryByText("Alfa")).not.toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    expect(screen.getByText("1 elementos")).toBeInTheDocument();
  });

  it("muestra mensaje vacío cuando la búsqueda no encuentra nada", () => {
    render(<DataTable data={mockData} columns={columns} />);
    const input = screen.getByPlaceholderText("Buscar...");
    fireEvent.change(input, { target: { value: "xyz" } });
    expect(screen.getByText("No se encontraron elementos")).toBeInTheDocument();
  });

  it("usa placeholder y label personalizados", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        searchPlaceholder="Buscar carreras..."
        label="carreras"
      />,
    );
    expect(screen.getByPlaceholderText("Buscar carreras...")).toBeInTheDocument();
    expect(screen.getByText("0 carreras")).toBeInTheDocument();
  });

  it("muestra skeleton de loading con 5 filas", () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} isLoading />,
    );
    const skeletons = container.querySelectorAll("tr[class*='skeleton']");
    expect(skeletons.length).toBe(0);
    const skeletonDivs = container.querySelectorAll(
      ".animate-pulse",
    );
    expect(skeletonDivs.length).toBeGreaterThan(0);
  });

  it("muestra columna de acciones cuando hay onEdit", () => {
    const onEdit = vi.fn();
    render(<DataTable data={mockData} columns={columns} onEdit={onEdit} />);
    expect(screen.getByText("Acciones")).toBeInTheDocument();
  });

  it("muestra columna de acciones cuando hay onDelete", () => {
    const onDelete = vi.fn();
    render(<DataTable data={mockData} columns={columns} onDelete={onDelete} />);
    expect(screen.getByText("Acciones")).toBeInTheDocument();
  });

  it("llama a onEdit al hacer click en editar", () => {
    const onEdit = vi.fn();
    render(<DataTable data={mockData} columns={columns} onEdit={onEdit} />);
    const editButtons = screen.getAllByTitle("Editar");
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it("llama a onDelete al hacer click en eliminar", () => {
    const onDelete = vi.fn();
    render(<DataTable data={mockData} columns={columns} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it("ordena por columna al hacer click en encabezado", () => {
    render(<DataTable data={mockData} columns={columns} />);
    const nombreHeader = screen.getByText("Nombre");
    fireEvent.click(nombreHeader);
    const cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Alfa");
    fireEvent.click(nombreHeader);
    const cellsAfter = screen.getAllByRole("cell");
    expect(cellsAfter[0]).toHaveTextContent("Charlie");
  });

  it("renderiza columna con función render personalizada", () => {
    const customColumns: Column<TestRow>[] = [
      {
        key: "nombre",
        label: "Nombre",
        render: (val) => `Custom: ${String(val)}`,
      },
    ];
    render(<DataTable data={mockData} columns={customColumns} />);
    expect(screen.getByText("Custom: Alfa")).toBeInTheDocument();
  });

  it("no muestra columna de acciones sin onEdit ni onDelete", () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.queryByText("Acciones")).not.toBeInTheDocument();
  });
});
