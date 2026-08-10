import type {
  PlantillaDTO,
  WidgetPosicionInput,
} from "../../../shared/api/plantillas";
import type { WidgetDTO } from "../../../shared/api/widgets";

export type WidgetType =
  | "horarios"
  | "examenes"
  | "calendario"
  | "mapa"
  | "noticias";

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
  noticias: {
    type: "noticias",
    label: "Noticias",
    colSpan: 4,
    rowSpan: 2,
    color: "from-purple-100 to-purple-200",
  },
};

export const GRID_COLS = 4;
export const GRID_ROWS = 6;

export interface WidgetPlacement {
  id: string;
  type: WidgetType;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
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
    widgets: (dto.widgets_posiciones ?? []).map((pos) => {
      const tipo = pos.widget_tipo as WidgetType;
      const fallback = WIDGET_REGISTRY[tipo];
      return {
        id: `w${pos.id}`,
        type: tipo,
        col: pos.col_pos,
        row: pos.fila_pos,
        colSpan: pos.col_tam ?? fallback?.colSpan ?? 2,
        rowSpan: pos.fila_tam ?? fallback?.rowSpan ?? 2,
      };
    }),
  };
}

export function buildEffectiveRegistry(
  widgets: WidgetDTO[],
): Record<WidgetType, WidgetDefinition> {
  const registry = { ...WIDGET_REGISTRY };
  for (const w of widgets) {
    const tipo = w.tipo as WidgetType;
    if (tipo in registry) {
      registry[tipo] = {
        ...registry[tipo],
        colSpan: w.col_tam_default,
        rowSpan: w.fila_tam_default,
      };
    }
  }
  return registry;
}

export function plantillaToWidgetPositions(
  plantilla: Plantilla,
  widgetIdByTipo: Partial<Record<WidgetType, number>>,
): WidgetPosicionInput[] {
  return plantilla.widgets.flatMap((w) => {
    const widgetId = widgetIdByTipo[w.type];
    if (widgetId == null) return [];
    return [
      {
        widget: widgetId,
        col_pos: w.col,
        fila_pos: w.row,
        col_tam: w.colSpan,
        fila_tam: w.rowSpan,
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
    return (
      newCol < w.col + w.colSpan &&
      newCol + newColSpan > w.col &&
      newRow < w.row + w.rowSpan &&
      newRow + newRowSpan > w.row
    );
  });
}
