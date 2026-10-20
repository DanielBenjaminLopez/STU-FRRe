import type { ComponentType } from "react";
import { useDraggable } from "@dnd-kit/core";
import type {
  WidgetType,
  WidgetDefinition,
  WidgetComponentProps,
  WidgetSizeVariant,
} from "../../features/widgets/placement";

function getPreviewScale(colSpan: number, rowSpan: number): number {
  if (colSpan === 1 && rowSpan === 1) return 0.4;
  if (colSpan === 2 && rowSpan === 1) return 0.28;
  if (colSpan === 2 && rowSpan === 2) return 0.25;
  return 0.22;
}

interface WidgetVariantCardProps {
  widget: WidgetDefinition;
  variant: WidgetSizeVariant;
  component: ComponentType<WidgetComponentProps>;
}

function WidgetVariantCard({
  widget,
  variant,
  component: Component,
}: WidgetVariantCardProps) {
  const variantKey = `${variant.colSpan}x${variant.rowSpan}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${widget.type}-${variantKey}`,
    data: {
      type: widget.type,
      colSpan: variant.colSpan,
      rowSpan: variant.rowSpan,
    },
  });

  const scale = getPreviewScale(variant.colSpan, variant.rowSpan);
  const inversePercent = `${(100 / scale).toFixed(2)}%`;
  const dimensionLabel =
    variant.label ?? `${variant.colSpan}\u00d7${variant.rowSpan}`;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-testid={`palette-item-${widget.type}-${variantKey}`}
      aria-label={`${widget.label} ${dimensionLabel}`}
      className={`group flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all group-hover:shadow-md group-hover:border-gray-300">
        <div className="relative h-24 overflow-hidden">
          <div
            className="absolute top-0 left-0 origin-top-left pointer-events-none animate-fade-in"
            style={{
              width: inversePercent,
              height: inversePercent,
              transform: `scale(${scale})`,
            }}
          >
            <Component colSpan={variant.colSpan} rowSpan={variant.rowSpan} />
          </div>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">
        {dimensionLabel}
      </span>
    </div>
  );
}

interface WidgetPaletteProps {
  widgets: WidgetDefinition[];
  components: Record<WidgetType, ComponentType<WidgetComponentProps>>;
}

export default function WidgetPalette({
  widgets,
  components,
}: WidgetPaletteProps) {
  return (
    <div className="w-80 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">Widgets</h2>
        <p className="text-sm text-gray-500 mt-1">
          Arrastrá los widgets a la plantilla
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
        <div className="flex flex-col gap-5">
          {widgets.map((w) => {
            const variants =
              w.variants && w.variants.length > 0
                ? w.variants
                : [{ colSpan: w.colSpan, rowSpan: w.rowSpan }];
            return (
              <div
                key={w.type}
                data-testid={`palette-section-${w.type}`}
                className="flex flex-col gap-2.5 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0"
              >
                <h3 className="text-sm font-semibold text-gray-800">
                  {w.label}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {variants.map((variant) => (
                    <WidgetVariantCard
                      key={`${w.type}-${variant.colSpan}x${variant.rowSpan}`}
                      widget={w}
                      variant={variant}
                      component={components[w.type]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
