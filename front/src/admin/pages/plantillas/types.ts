import type {
  PlantillaDTO,
  WidgetPosicionInput,
} from "../../../shared/api/plantillas";

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
    colSpan: 2,
    rowSpan: 2,
    color: "from-blue-100 to-blue-200",
  },
  mapa: {
    type: "mapa",
    label: "Mapa",
    colSpan: 2,
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
  isNew?: boolean;
}

export function plantillaDTOToLocal(dto: PlantillaDTO): Plantilla {
  return {
    id: String(dto.id),
    nombre: dto.nombre,
    widgets: (dto.widgets_posiciones ?? []).map((pos) => ({
      id: `w${pos.id}`,
      type: pos.widget_tipo as WidgetType,
      col: pos.col_pos,
      row: pos.fila_pos,
    })),
  };
}

export function plantillaToWidgetPositions(
  plantilla: Plantilla,
  widgetIdByTipo: Partial<Record<WidgetType, number>>,
): WidgetPosicionInput[] {
  return plantilla.widgets.flatMap((w) => {
    const def = WIDGET_REGISTRY[w.type];
    const widgetId = widgetIdByTipo[w.type];
    if (!def || widgetId == null) return [];
    return [
      {
        widget: widgetId,
        col_pos: w.col,
        fila_pos: w.row,
        col_tam: def.colSpan,
        fila_tam: def.rowSpan,
      },
    ];
  });
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
    if (!def) return false;
    return (
      newCol < w.col + def.colSpan &&
      newCol + newColSpan > w.col &&
      newRow < w.row + def.rowSpan &&
      newRow + newRowSpan > w.row
    );
  });
}
