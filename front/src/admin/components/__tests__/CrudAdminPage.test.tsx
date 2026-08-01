import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import CrudAdminPage from "../CrudAdminPage";
import type { Column } from "../DataTable";
import type { FormField } from "../DataFormModal";

interface TestItem {
  id: number;
  nombre: string;
}

const columns: Column<TestItem>[] = [{ key: "nombre", label: "Nombre" }];

const formFields: FormField[] = [
  { name: "nombre", label: "Nombre", type: "text", required: true },
];

const mockData: TestItem[] = [
  { id: 1, nombre: "Item A" },
  { id: 2, nombre: "Item B" },
];

const createConfig = (
  overrides?: Partial<Parameters<typeof CrudAdminPage<TestItem>>[0]["config"]>,
) => ({
  title: "Carreras",
  subtitle: "Gestión de carreras",
  entityName: "carrera",
  columns,
  formFields,
  fetchList: vi.fn().mockResolvedValue(mockData),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue(undefined),
  getRowLabel: (row: TestItem) => String(row.nombre),
  ...overrides,
});

describe("CrudAdminPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra el título y subtítulo", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    expect(screen.getByText("Carreras")).toBeInTheDocument();
    expect(screen.getByText("Gestión de carreras")).toBeInTheDocument();
  });

  it("muestra el botón de crear", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    expect(screen.getByText("Crear carrera")).toBeInTheDocument();
  });

  it("carga y muestra los datos en la tabla", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    expect(screen.getByText("Item B")).toBeInTheDocument();
  });

  it("muestra error cuando fetchList falla", async () => {
    const config = createConfig({
      fetchList: vi.fn().mockRejectedValue(new Error("Error de carga")),
    });
    render(<CrudAdminPage config={config} />);
    expect(await screen.findByText("Error de carga")).toBeInTheDocument();
  });

  it("muestra error genérico cuando el error no es Error", async () => {
    const config = createConfig({
      fetchList: vi.fn().mockRejectedValue("unknown"),
    });
    render(<CrudAdminPage config={config} />);
    expect(
      await screen.findByText("Error al cargar los datos"),
    ).toBeInTheDocument();
  });

  it("abre el modal de crear al hacer click en Crear", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Crear carrera/ }));
    expect(
      screen.getByRole("heading", { name: "Crear carrera" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /nombre/i }),
    ).toBeInTheDocument();
  });

  it("abre el modal de editar al hacer click en editar", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByTitle("Editar");
    fireEvent.click(editButtons[0]);
    expect(screen.getByText("Editar carrera")).toBeInTheDocument();
  });

  it("abre el modal de eliminar al hacer click en eliminar", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Eliminar carrera")).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro/)).toBeInTheDocument();
  });

  it("ejecuta create al guardar en el modal de crear", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Crear carrera"));
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "Nueva Carrera" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(config.create).toHaveBeenCalledWith({ nombre: "Nueva Carrera" });
    });
  });

  it("ejecuta update al guardar en el modal de editar", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByTitle("Editar");
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "Item A Modificado" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(config.update).toHaveBeenCalledWith(1, {
        nombre: "Item A Modificado",
      });
    });
  });

  it("ejecuta remove al confirmar eliminación", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(config.remove).toHaveBeenCalledWith(1);
    });
  });

  it("recarga los datos después de crear", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Crear carrera"));
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "Nueva" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(config.fetchList).toHaveBeenCalledTimes(2);
    });
  });

  it("recarga los datos después de eliminar", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(config.fetchList).toHaveBeenCalledTimes(2);
    });
  });

  it("no muestra botón de crear cuando no hay create", async () => {
    const config = createConfig({ create: undefined });
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    expect(screen.queryByText("Crear carrera")).not.toBeInTheDocument();
  });

  it("no muestra columna de acciones cuando no hay update ni remove", async () => {
    const config = createConfig({ update: undefined, remove: undefined });
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    expect(screen.queryByText("Acciones")).not.toBeInTheDocument();
  });

  it("recarga los datos después de editar", async () => {
    const config = createConfig();
    render(<CrudAdminPage config={config} />);
    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByTitle("Editar");
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByRole("textbox", { name: /nombre/i }), {
      target: { value: "Modificado" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(config.fetchList).toHaveBeenCalledTimes(2);
    });
  });
});
