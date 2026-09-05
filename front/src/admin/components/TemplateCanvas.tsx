import { useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type {
  WidgetPlacement,
  WidgetType,
  WidgetDefinition,
} from "../pages/plantillas/types";
import { GRID_COLS, GRID_ROWS } from "../pages/plantillas/types";
import {
  useTotemScale,
  TOTEM_WIDTH,
  TOTEM_HEIGHT,
} from "../../shared/hooks/useTotemScale";
import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import Calendar from "../../shared/components/widgets/Calendar";
import Mapa from "../../shared/components/widgets/Mapa";
import Noticias from "../../shared/components/widgets/Noticias";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
  calendario: Calendar,
  mapa: Mapa,
  noticias: Noticias,
};

interface PlacedWidgetProps {
  widget: WidgetPlacement;
  onRemove: (id: string) => void;
}

function PlacedWidget({ widget, onRemove }: PlacedWidgetProps) {
  const Component = WIDGET_COMPONENTS[widget.type];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${widget.id}`,
    data: { widgetId: widget.id, widgetType: widget.type, type: widget.type },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative group overflow-hidden w-full h-full grid ${isDragging ? "opacity-30" : ""}`}
      style={{
        gridColumn: `${widget.col + 1} / span ${widget.colSpan}`,
        gridRow: `${widget.row + 1} / span ${widget.rowSpan}`,
        gridTemplateColumns: `repeat(${widget.colSpan}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${widget.rowSpan}, minmax(0, 1fr))`,
      }}
      {...listeners}
      {...attributes}
    >
      <Component />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(widget.id);
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200 z-10"
        title="Quitar widget"
      >
        <svg
          className="w-3.5 h-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface TemplateCanvasProps {
  widgets: WidgetPlacement[];
  onRemoveWidget: (id: string) => void;
  onScaleChange?: (scale: number) => void;
  hoverCell: { col: number; row: number } | null;
  activeType: WidgetType | null;
  registry: Record<WidgetType, WidgetDefinition>;
}

export default function TemplateCanvas({
  widgets,
  onRemoveWidget,
  onScaleChange,
  hoverCell,
  activeType,
  registry,
}: TemplateCanvasProps) {
  const { containerRef, scale } = useTotemScale();

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);
  const { setNodeRef } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-start overflow-hidden p-4"
    >
      <div
        className="origin-top shrink-0 bg-white border-2 border-dashed rounded-3xl overflow-hidden transition-colors border-gray-200"
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <div className="flex flex-col w-full h-full p-16 gap-16">
          <Encabezado />
          <div
            ref={setNodeRef}
            data-canvas
            data-grid
            className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4 rounded-2xl transition-colors"
          >
            {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
              const col = (i % GRID_COLS) + 1;
              const row = Math.floor(i / GRID_COLS) + 1;
              return (
                <div
                  key={`cell-${i}`}
                  style={{ gridColumn: col, gridRow: row }}
                  className="bg-gray-50/50 rounded-xl pointer-events-none"
                />
              );
            })}

            {hoverCell &&
              activeType &&
              (() => {
                const Ghost = WIDGET_COMPONENTS[activeType];
                const def = registry[activeType];
                return Ghost ? (
                  <div
                    className="overflow-hidden opacity-60 grid rounded-4xl pointer-events-none"
                    style={{
                      gridColumn: `${hoverCell.col + 1} / span ${def.colSpan}`,
                      gridRow: `${hoverCell.row + 1} / span ${def.rowSpan}`,
                      gridTemplateColumns: `repeat(${def.colSpan}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${def.rowSpan}, minmax(0, 1fr))`,
                    }}
                  >
                    <Ghost />
                  </div>
                ) : null;
              })()}

            {widgets.map((w) => (
              <PlacedWidget key={w.id} widget={w} onRemove={onRemoveWidget} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
