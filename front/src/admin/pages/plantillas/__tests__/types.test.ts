import { describe, it, expect } from "vitest";
import {
  checkCollision,
  computeResizeSpan,
  getCellFromPoint,
  GRID_COLS,
  GRID_ROWS,
  type WidgetPlacement,
} from "../types";

function makeWidget(
  type: "horarios" | "examenes" | "calendario" | "mapa",
  col: number,
  row: number,
  id = "test",
  colSpan?: number,
  rowSpan?: number,
): WidgetPlacement {
  const defaults = {
    horarios: [4, 2],
    examenes: [4, 2],
    calendario: [2, 2],
    mapa: [2, 2],
  };
  const [dCol, dRow] = defaults[type];
  return {
    id,
    type,
    col,
    row,
    colSpan: colSpan ?? dCol,
    rowSpan: rowSpan ?? dRow,
  };
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

describe("computeResizeSpan", () => {
  it("devuelve null si el tamaño no cambia", () => {
    const w = makeWidget("calendario", 0, 0, "w1", 2, 2);
    expect(computeResizeSpan(w, { col: 1, row: 1 }, [])).toBeNull();
  });

  it("amplía el widget cuando se arrastra hacia abajo a la derecha", () => {
    const w = makeWidget("calendario", 0, 0, "w1", 2, 2);
    const result = computeResizeSpan(w, { col: 3, row: 3 }, []);
    expect(result).toEqual({ colSpan: 4, rowSpan: 4 });
  });

  it("reduce el widget cuando se arrastra hacia arriba a la izquierda", () => {
    const w = makeWidget("horarios", 0, 0, "w1", 4, 2);
    const result = computeResizeSpan(w, { col: 1, row: 0 }, []);
    expect(result).toEqual({ colSpan: 2, rowSpan: 1 });
  });

  it("clampea al límite de la grilla (no excede GRID_COLS)", () => {
    const w = makeWidget("calendario", 0, 0, "w1", 2, 2);
    const result = computeResizeSpan(w, { col: 3, row: 1 }, []);
    expect(result).toEqual({ colSpan: 4, rowSpan: 2 });
  });

  it("clampea al límite de la grilla (no excede GRID_ROWS)", () => {
    const w = makeWidget("calendario", 0, 0, "w1", 2, 2);
    const result = computeResizeSpan(w, { col: 1, row: 5 }, []);
    expect(result).toEqual({ colSpan: 2, rowSpan: 6 });
  });

  it("mantiene mínimo de 1 columna y 1 fila", () => {
    const w = makeWidget("horarios", 0, 0, "w1", 4, 2);
    const result = computeResizeSpan(w, { col: 0, row: 0 }, []);
    expect(result).toEqual({ colSpan: 1, rowSpan: 1 });
  });

  it("devuelve null si colisiona con otro widget", () => {
    const w1 = makeWidget("calendario", 0, 0, "w1", 2, 2);
    const w2 = makeWidget("examenes", 0, 2, "w2");
    const result = computeResizeSpan(w1, { col: 3, row: 3 }, [w2]);
    expect(result).toBeNull();
  });

  it("funciona cuando el widget está en el borde derecho", () => {
    const w = makeWidget("calendario", 2, 0, "w1", 2, 2);
    const result = computeResizeSpan(w, { col: 3, row: 0 }, []);
    expect(result).toEqual({ colSpan: 2, rowSpan: 1 });
  });
});

describe("getCellFromPoint", () => {
  const gridRect = {
    left: 0,
    top: 0,
    width: 416,
    height: 616,
    right: 416,
    bottom: 616,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect;

  it("devuelve null si las dimensiones de celda son <= 0", () => {
    const emptyRect = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect;
    expect(getCellFromPoint(0, 0, emptyRect)).toBeNull();
  });

  it("devuelve la celda correcta para la esquina superior izquierda", () => {
    const cell = getCellFromPoint(10, 10, gridRect);
    expect(cell).toEqual({ col: 0, row: 0 });
  });

  it("devuelve null para coordenadas fuera de la grilla", () => {
    expect(getCellFromPoint(-10, 10, gridRect)).toBeNull();
    expect(getCellFromPoint(10, -10, gridRect)).toBeNull();
    expect(getCellFromPoint(500, 10, gridRect)).toBeNull();
    expect(getCellFromPoint(10, 700, gridRect)).toBeNull();
  });

  it("devuelve la última celda válida en la esquina inferior derecha", () => {
    const cell = getCellFromPoint(350, 490, gridRect);
    expect(cell).toEqual({ col: GRID_COLS - 1, row: GRID_ROWS - 1 });
  });
});
