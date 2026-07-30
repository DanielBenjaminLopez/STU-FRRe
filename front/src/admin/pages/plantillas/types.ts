export type WidgetType = "horarios" | "examenes" | "calendario" | "mapa";

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  colSpan: number;
  rowSpan: number;
  color: string;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  horarios: {
    type: "horarios",
    label: "Horarios",
    colSpan: 4,
    rowSpan: 2,
    color: "from-gray-100 to-gray-200",
  },
  examenes: {
    type: "examenes",
    label: "Exámenes",
    colSpan: 4,
    rowSpan: 2,
    color: "from-green-100 to-green-200",
  },
  calendario: {
    type: "calendario",
    label: "Calendario",
    colSpan: 4,
    rowSpan: 2,
    color: "from-blue-100 to-blue-200",
  },
  mapa: {
    type: "mapa",
    label: "Mapa",
    colSpan: 4,
    rowSpan: 2,
    color: "from-orange-100 to-orange-200",
  },
};

export const GRID_COLS = 4;
export const GRID_ROWS = 6;

export interface WidgetPlacement {
  id: string;
  type: WidgetType;
  col: number;
  row: number;
}

export interface Plantilla {
  id: string;
  nombre: string;
  widgets: WidgetPlacement[];
}

export function checkCollision(
  widgets: WidgetPlacement[],
  newCol: number,
  newRow: number,
  newColSpan: number,
  newRowSpan: number,
): boolean {
  return widgets.some((w) => {
    const def = WIDGET_REGISTRY[w.type];
    return (
      newCol < w.col + def.colSpan &&
      newCol + newColSpan > w.col &&
      newRow < w.row + def.rowSpan &&
      newRow + newRowSpan > w.row
    );
  });
}
