import { useEffect, useRef, useState, memo } from "react";
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
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const PlacedWidget = memo(function PlacedWidget({
  widget,
  onRemove,
  isSelected = false,
  onSelect,
}: PlacedWidgetProps) {
  const Component = WIDGET_COMPONENTS[widget.type];
  const [isRemoving, setIsRemoving] = useState(false);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, []);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${widget.id}`,
    data: { widgetId: widget.id, widgetType: widget.type, type: widget.type },
  });

  const isActuallySelected = isSelected && !isDragging;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    removeTimerRef.current = setTimeout(() => {
      onRemove(widget.id);
    }, 180);
  };

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(widget.id);
      }}
      className={`relative overflow-hidden w-full h-full rounded-3xl cursor-pointer transition-all duration-200 ${
        isDragging ? "opacity-30" : ""
      } ${
        isRemoving
          ? "opacity-0 scale-90 pointer-events-none"
          : "opacity-100 scale-100"
      } ${isActuallySelected ? "z-20" : "z-0"}`}
      style={{
        gridColumn: `${widget.col + 1} / span ${widget.colSpan}`,
        gridRow: `${widget.row + 1} / span ${widget.rowSpan}`,
      }}
      {...listeners}
      {...attributes}
    >
      <div
        className={`w-full h-full grid transition-all duration-200 ${
          isActuallySelected ? "grayscale" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${widget.colSpan}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${widget.rowSpan}, minmax(0, 1fr))`,
        }}
      >
        <Component />
      </div>

      {isActuallySelected && !isRemoving && (
        <div
          className="absolute inset-0 bg-black/25 pointer-events-none z-10 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {isActuallySelected && !isRemoving && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <button
            type="button"
            onClick={handleRemove}
            className="pointer-events-auto w-12 h-12 rounded-full bg-gray-900 text-white shadow-2xl shadow-black/40 ring-4 ring-white/30 hover:bg-red-600 hover:shadow-red-500/40 hover:scale-110 hover:rotate-90 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer select-none animate-widget-pop-in"
            aria-label="Eliminar widget"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

interface TemplateCanvasProps {
  widgets: WidgetPlacement[];
  onRemoveWidget: (id: string) => void;
  onScaleChange?: (scale: number) => void;
  hoverCell: { col: number; row: number } | null;
  activeType: WidgetType | null;
  registry: Record<WidgetType, WidgetDefinition>;
  selectedWidgetId?: string | null;
  onSelectWidget?: (id: string | null) => void;
}

export default function TemplateCanvas({
  widgets,
  onRemoveWidget,
  onScaleChange,
  hoverCell,
  activeType,
  registry,
  selectedWidgetId,
  onSelectWidget,
}: TemplateCanvasProps) {
  const { containerRef, scale, isReady } = useTotemScale();

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);
  const { setNodeRef } = useDroppable({ id: "canvas" });

  const isVisible = isReady !== false;

  return (
    <div
      ref={containerRef}
      onClick={() => onSelectWidget?.(null)}
      className="flex-1 flex flex-col items-center justify-start overflow-hidden p-4"
    >
      <div
        className={`origin-top shrink-0 bg-white border-2 border-dashed rounded-3xl overflow-hidden border-gray-200 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
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
                const def = registry[activeType];
                if (!def) return null;
                return (
                  <div
                    data-testid="drop-indicator"
                    aria-label={`Zona para soltar ${def.label}`}
                    className="overflow-hidden rounded-4xl border-2 border-dashed border-gray-400/80 bg-gray-900/5 pointer-events-none transition-all duration-75"
                    style={{
                      gridColumn: `${hoverCell.col + 1} / span ${def.colSpan}`,
                      gridRow: `${hoverCell.row + 1} / span ${def.rowSpan}`,
                    }}
                  />
                );
              })()}

            {widgets.map((w) => (
              <PlacedWidget
                key={w.id}
                widget={w}
                onRemove={onRemoveWidget}
                isSelected={selectedWidgetId === w.id}
                onSelect={(id) => onSelectWidget?.(id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
