import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import PlantillasPage from "../PlantillasPage";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => ({})),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}));

vi.mock("../../../shared/components/widgets/Horarios", () => ({
  default: () => <div data-testid="widget-horarios">Horarios mock</div>,
}));

vi.mock("../../../shared/components/widgets/Examenes", () => ({
  default: () => <div data-testid="widget-examenes">Examenes mock</div>,
}));

describe("PlantillasPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza la paleta de widgets", () => {
    render(<PlantillasPage />);
    expect(screen.getByText("Agregar elementos")).toBeInTheDocument();
  });

  it("renderiza el nombre de la plantilla por defecto", () => {
    render(<PlantillasPage />);
    expect(screen.getByDisplayValue("Nueva plantilla")).toBeInTheDocument();
  });

  it("renderiza el botón de nueva plantilla", () => {
    render(<PlantillasPage />);
    expect(screen.getByText("+ Nueva plantilla")).toBeInTheDocument();
  });

  it("renderiza el botón de guardar", () => {
    render(<PlantillasPage />);
    expect(screen.getByText("Guardar")).toBeInTheDocument();
  });

  it("permite cambiar el nombre de la plantilla", () => {
    render(<PlantillasPage />);
    const input = screen.getByDisplayValue("Nueva plantilla");
    fireEvent.change(input, { target: { value: "Mi Plantilla" } });
    expect(screen.getByDisplayValue("Mi Plantilla")).toBeInTheDocument();
  });

  it("crea una nueva plantilla al hacer click en nueva plantilla", () => {
    render(<PlantillasPage />);
    const before = screen.getAllByText("Nueva plantilla").length;
    fireEvent.click(screen.getByText("+ Nueva plantilla"));
    const after = screen.getAllByText("Nueva plantilla").length;
    expect(after).toBe(before + 1);
  });

  it("persiste plantillas en localStorage", () => {
    render(<PlantillasPage />);
    const input = screen.getByDisplayValue("Nueva plantilla");
    fireEvent.change(input, { target: { value: "Persisted" } });
    const saved = localStorage.getItem("plantillas");
    expect(saved).toBeTruthy();
    expect(saved).toContain("Persisted");
  });
});
