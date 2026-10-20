import { useEffect, useRef, useState, memo } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type {
  WidgetPlacement,
  WidgetType,
  WidgetDefinition,
  WidgetSizeVariant,
} from "../../features/widgets/placement";
import { GRID_COLS, GRID_ROWS } from "../../features/widgets/placement";
import {
  useTotemScale,
  TOTEM_WIDTH,
  TOTEM_HEIGHT,
} from "../../shared/hooks/useTotemScale";
import { WIDGET_COMPONENTS } from "../../features/widgets";
import { Encabezado } from "../../features/layout";

interface PlacedWidgetProps {
  widget: WidgetPlacement;
  variants?: WidgetSizeVariant[];
  onRemove: (id: string) => void;
  onResize?: (id: string, colSpan: number, rowSpan: number) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isClearing?: boolean;
}

const PlacedWidget = memo(function PlacedWidget({
  widget,
  variants,
  onRemove,
  onResize,
  isSelected = false,
  onSelect,
  isClearing = false,
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
    data: {
      widgetId: widget.id,
      widgetType: widget.type,
      type: widget.type,
      colSpan: widget.colSpan,
      rowSpan: widget.rowSpan,
    },
  });

  const isActuallySelected = isSelected && !isDragging;
  const hasMultipleVariants = Boolean(variants && variants.length > 1);

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
      className={`relative overflow-hidden w-full h-full rounded-4xl cursor-pointer transition-all duration-200 ${
        isDragging ? "opacity-30" : ""
      } ${
        isRemoving || isClearing
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
        <Component colSpan={widget.colSpan} rowSpan={widget.rowSpan} />
      </div>

      {isActuallySelected && !isRemoving && (
        <div
          className="absolute inset-0 bg-black/25 pointer-events-none z-10 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {isActuallySelected && !isRemoving && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none z-30">
          {hasMultipleVariants && onResize && (
            <div
              role="group"
              aria-label="Cambiar tamaño del widget"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center gap-1.5 bg-gray-900 p-1.5 rounded-full ring-4 ring-white/30 select-none animate-widget-pop-in"
            >
              {variants!.map((variant) => {
                const isActive =
                  widget.colSpan === variant.colSpan &&
                  widget.rowSpan === variant.rowSpan;
                const label =
                  variant.label ?? `${variant.colSpan}×${variant.rowSpan}`;
                return (
                  <button
                    key={`${variant.colSpan}x${variant.rowSpan}`}
                    type="button"
                    aria-label={`Tamaño ${label}`}
                    aria-pressed={isActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActive) {
                        onResize(widget.id, variant.colSpan, variant.rowSpan);
                      }
                    }}
                    className={`${
                      widget.colSpan === 1
                        ? "px-2.5 py-1 text-xs"
                        : "px-4 py-1.5 text-sm"
                    } rounded-full font-semibold transition-all cursor-pointer select-none ${
                      isActive
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleRemove}
            className="pointer-events-auto w-12 h-12 rounded-full bg-gray-900 text-white ring-4 ring-white/30 hover:bg-red-600 hover:scale-110 hover:rotate-90 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer select-none animate-widget-pop-in"
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
  onResizeWidget?: (id: string, colSpan: number, rowSpan: number) => void;
  onScaleChange?: (scale: number) => void;
  hoverCell: { col: number; row: number } | null;
  activeType: WidgetType | null;
  activeSpan?: { colSpan: number; rowSpan: number } | null;
  registry: Record<WidgetType, WidgetDefinition>;
  selectedWidgetId?: string | null;
  onSelectWidget?: (id: string | null) => void;
  isClearing?: boolean;
}

export default function TemplateCanvas({
  widgets,
  onRemoveWidget,
  onResizeWidget,
  onScaleChange,
  hoverCell,
  activeType,
  activeSpan,
  registry,
  selectedWidgetId,
  onSelectWidget,
  isClearing,
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
        className={`totem-scale-stage bg-white border-2 border-dashed rounded-3xl overflow-hidden border-gray-200 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          willChange: "transform",
        }}
      >
        <div className="flex flex-col w-full h-full p-16 gap-16">
          <Encabezado size="lg" />
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
                const dropColSpan = activeSpan?.colSpan ?? def.colSpan;
                const dropRowSpan = activeSpan?.rowSpan ?? def.rowSpan;
                const isNovedades = activeType === "novedades";
                const isNoticias = activeType === "noticias";
                const indicatorClass = isNovedades
                  ? "border-amber-400 bg-amber-300/30"
                  : isNoticias
                    ? "border-purple-400 bg-purple-300/30"
                    : "border-gray-400/80 bg-gray-900/5";
                return (
                  <div
                    data-testid="drop-indicator"
                    aria-label={`Zona para soltar ${def.label}`}
                    className={`overflow-hidden rounded-4xl border-2 border-dashed pointer-events-none transition-all duration-75 ${indicatorClass}`}
                    style={{
                      gridColumn: `${hoverCell.col + 1} / span ${dropColSpan}`,
                      gridRow: `${hoverCell.row + 1} / span ${dropRowSpan}`,
                    }}
                  />
                );
              })()}

            {widgets.map((w) => (
              <PlacedWidget
                key={w.id}
                widget={w}
                variants={registry[w.type]?.variants}
                onRemove={onRemoveWidget}
                onResize={onResizeWidget}
                isSelected={selectedWidgetId === w.id}
                onSelect={(id) => onSelectWidget?.(id)}
                isClearing={isClearing}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
