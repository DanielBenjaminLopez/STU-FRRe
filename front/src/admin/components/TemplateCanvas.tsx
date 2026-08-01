import { useCallback, useEffect, useRef, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type {
  WidgetPlacement,
  WidgetType,
  WidgetDefinition,
} from "../pages/plantillas/types";
import {
  GRID_COLS,
  GRID_ROWS,
  computeResizeSpan,
  getCellFromPoint,
} from "../pages/plantillas/types";
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

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
  calendario: Calendar,
  mapa: Mapa,
};

interface PlacedWidgetProps {
  widget: WidgetPlacement;
  onRemove: (id: string) => void;
  onResize?: (id: string, colSpan: number, rowSpan: number) => void;
  getGridRect?: () => DOMRect | null;
  getOtherWidgets?: () => WidgetPlacement[];
}

function PlacedWidget({
  widget,
  onRemove,
  onResize,
  getGridRect,
  getOtherWidgets,
}: PlacedWidgetProps) {
  const Component = WIDGET_COMPONENTS[widget.type];
  const [draftSpan, setDraftSpan] = useState<{
    colSpan: number;
    rowSpan: number;
  } | null>(null);
  const resizingRef = useRef(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${widget.id}`,
    data: { widgetId: widget.id, widgetType: widget.type, type: widget.type },
  });

  const colSpan = draftSpan?.colSpan ?? widget.colSpan;
  const rowSpan = draftSpan?.rowSpan ?? widget.rowSpan;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onResize || !getGridRect || !getOtherWidgets) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizingRef.current = true;
    },
    [onResize, getGridRect, getOtherWidgets],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizingRef.current || !getGridRect || !getOtherWidgets) return;
      const rect = getGridRect();
      if (!rect) return;
      const cell = getCellFromPoint(e.clientX, e.clientY, rect);
      if (!cell) return;
      const result = computeResizeSpan(widget, cell, getOtherWidgets());
      setDraftSpan(result);
    },
    [widget, getGridRect, getOtherWidgets],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (draftSpan && onResize) {
        onResize(widget.id, draftSpan.colSpan, draftSpan.rowSpan);
      }
      setDraftSpan(null);
    },
    [draftSpan, widget.id, onResize],
  );

  return (
    <div
      ref={setNodeRef}
      className={`relative group overflow-hidden w-full grid ${
        isDragging ? "ring-2 ring-cyan-400 ring-offset-1" : ""
      } ${draftSpan ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
      style={{
        gridColumn: `${widget.col + 1} / span ${colSpan}`,
        gridRow: `${widget.row + 1} / span ${rowSpan}`,
        gridTemplateColumns: `repeat(${colSpan}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rowSpan}, minmax(0, 1fr))`,
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
      {onResize && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 z-10"
          data-resize-handle
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14 14L10 14L14 10M14 14L14 10M14 14L10 14M14 14L14 10M11 14L14 11"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

interface TemplateCanvasProps {
  widgets: WidgetPlacement[];
  nombre: string;
  onNombreChange: (nombre: string) => void;
  onRemoveWidget: (id: string) => void;
  onResizeWidget?: (id: string, colSpan: number, rowSpan: number) => void;
  onScaleChange?: (scale: number) => void;
  hoverCell: { col: number; row: number } | null;
  activeType: WidgetType | null;
  registry: Record<WidgetType, WidgetDefinition>;
}

export default function TemplateCanvas({
  widgets,
  nombre,
  onNombreChange,
  onRemoveWidget,
  onResizeWidget,
  onScaleChange,
  hoverCell,
  activeType,
  registry,
}: TemplateCanvasProps) {
  const { containerRef, scale } = useTotemScale();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  const getGridRect = useCallback((): DOMRect | null => {
    return gridRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const getOtherWidgets = useCallback(
    (excludeId: string) => {
      return widgets.filter((w) => w.id !== excludeId);
    },
    [widgets],
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-start overflow-hidden p-4"
    >
      <input
        type="text"
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        className="text-xl font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors px-1 py-0.5 w-fit mb-2 shrink-0"
        placeholder="Nombre plantilla"
      />

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
            ref={(node) => {
              setNodeRef(node);
              (
                gridRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = node;
            }}
            data-canvas
            data-grid
            className={`flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4 rounded-2xl transition-colors ${
              isOver ? "ring-2 ring-cyan-300 bg-cyan-50/30" : ""
            }`}
          >
            {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
              <div key={`cell-${i}`} className="bg-gray-50/50 rounded-xl" />
            ))}

            {hoverCell &&
              activeType &&
              (() => {
                const Ghost = WIDGET_COMPONENTS[activeType];
                const def = registry[activeType];
                return Ghost ? (
                  <div
                    className="overflow-hidden opacity-60 grid"
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
              <PlacedWidget
                key={w.id}
                widget={w}
                onRemove={onRemoveWidget}
                onResize={
                  onResizeWidget
                    ? (id, colSpan, rowSpan) =>
                        onResizeWidget(id, colSpan, rowSpan)
                    : undefined
                }
                getGridRect={onResizeWidget ? getGridRect : undefined}
                getOtherWidgets={
                  onResizeWidget ? () => getOtherWidgets(w.id) : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
