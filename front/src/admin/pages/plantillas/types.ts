export type WidgetType = "horarios" | "examenes";

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  colSpan: number;
  rowSpan: number;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  horarios: { type: "horarios", label: "Horarios", colSpan: 4, rowSpan: 2 },
  examenes: { type: "examenes", label: "Exámenes", colSpan: 4, rowSpan: 2 },
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
