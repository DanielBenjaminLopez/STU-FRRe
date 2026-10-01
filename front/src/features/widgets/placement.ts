import type { PlantillaDTO, WidgetPosicionInput } from "./api/plantillas";
import type { WidgetDTO } from "./api/widgets";

export { GRID_COLS, GRID_ROWS } from "./types";
export { WIDGET_REGISTRY } from "./registry";
import type { WidgetDefinition, WidgetPlacement, WidgetType } from "./types";
import { WIDGET_REGISTRY } from "./registry";
export type { WidgetDefinition, WidgetPlacement, WidgetType } from "./types";

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
