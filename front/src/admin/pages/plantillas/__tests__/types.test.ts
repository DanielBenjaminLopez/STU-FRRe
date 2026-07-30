import { describe, it, expect } from "vitest";
import { checkCollision, type WidgetPlacement } from "../types";

function makeWidget(
  type: "horarios" | "examenes" | "calendario" | "mapa",
  col: number,
  row: number,
  id = "test",
): WidgetPlacement {
  return { id, type, col, row };
}

describe("checkCollision", () => {
  it("no colisiona cuando no hay widgets existentes", () => {
    expect(checkCollision([], 0, 0, 4, 2)).toBe(false);
  });

  it("no colisiona cuando los widgets no se superponen", () => {
    const widgets = [makeWidget("horarios", 0, 0, "w1")];
    expect(checkCollision(widgets, 0, 2, 4, 2)).toBe(false);
  });

  it("colisiona cuando los widgets se superponen verticalmente", () => {
    const widgets = [makeWidget("horarios", 0, 0, "w1")];
    expect(checkCollision(widgets, 0, 1, 4, 2)).toBe(true);
  });

  it("colisiona cuando los widgets se superponen completamente", () => {
    const widgets = [makeWidget("horarios", 0, 0, "w1")];
    expect(checkCollision(widgets, 0, 0, 4, 2)).toBe(true);
  });

  it("colisiona cuando un widget está dentro de otro", () => {
    const widgets = [makeWidget("horarios", 0, 0, "w1")];
    expect(checkCollision(widgets, 1, 0, 2, 1)).toBe(true);
  });

  it("no colisiona con widgets en posiciones distintas no superpuestas", () => {
    const widgets = [
      makeWidget("horarios", 0, 0, "w1"),
      makeWidget("examenes", 0, 2, "w2"),
    ];
    expect(checkCollision(widgets, 0, 4, 4, 2)).toBe(false);
  });

  it("colisiona con el segundo widget pero no con el primero", () => {
    const widgets = [
      makeWidget("horarios", 0, 0, "w1"),
      makeWidget("examenes", 0, 2, "w2"),
    ];
    expect(checkCollision(widgets, 0, 3, 4, 2)).toBe(true);
  });

  it("los widgets de 4 columnas caben en filas 0-1, 2-3, 4-5", () => {
    const widgets = [
      makeWidget("horarios", 0, 0, "w1"),
      makeWidget("examenes", 0, 2, "w2"),
    ];
    expect(checkCollision(widgets, 0, 4, 4, 2)).toBe(false);
  });

  it("acepta widgets de tipo calendario", () => {
    const widgets = [makeWidget("calendario", 0, 0, "w1")];
    expect(checkCollision(widgets, 0, 2, 4, 2)).toBe(false);
  });

  it("acepta widgets de tipo mapa", () => {
    const widgets = [makeWidget("mapa", 0, 0, "w1")];
    expect(checkCollision(widgets, 0, 2, 4, 2)).toBe(false);
  });

  it("colisiona entre calendario y mapa en la misma posición", () => {
    const widgets = [makeWidget("calendario", 0, 0, "w1")];
    expect(checkCollision(widgets, 0, 0, 4, 2)).toBe(true);
  });

  it("mezcla de todos los tipos sin colisión", () => {
    const widgets = [
      makeWidget("horarios", 0, 0, "w1"),
      makeWidget("examenes", 0, 2, "w2"),
      makeWidget("calendario", 0, 4, "w3"),
    ];
    expect(checkCollision(widgets, 0, 4, 4, 2)).toBe(true);
    expect(checkCollision(widgets, 0, 0, 4, 2)).toBe(true);
    expect(checkCollision(widgets, 0, 2, 4, 2)).toBe(true);
  });
});
