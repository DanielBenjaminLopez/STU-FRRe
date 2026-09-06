import type { ComponentType } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { WidgetType, WidgetDefinition } from "../pages/plantillas/types";

interface WidgetCardProps {
  widget: WidgetDefinition;
  component: ComponentType;
}

function WidgetCard({ widget, component: Component }: WidgetCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${widget.type}`,
    data: { type: widget.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-2xl border border-gray-200 bg-white cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-md hover:border-gray-300 ${
        isDragging ? "opacity-40 shadow-none" : ""
      }`}
    >
      <div className="relative h-36 overflow-hidden">
        <div
          className="absolute top-0 left-0 origin-top-left pointer-events-none animate-fade-in"
          style={{ width: "250%", height: "250%", transform: "scale(0.4)" }}
        >
          <Component />
        </div>
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <span className="text-xs font-medium text-gray-500">
          {widget.label} ({widget.colSpan}&times;{widget.rowSpan})
        </span>
      </div>
    </div>
  );
}

interface WidgetPaletteProps {
  widgets: WidgetDefinition[];
  components: Record<WidgetType, ComponentType>;
}

export default function WidgetPalette({
  widgets,
  components,
}: WidgetPaletteProps) {
  return (
    <div className="w-72 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">Widgets</h2>
        <p className="text-sm text-gray-500 mt-1">
          Arrastrá los widgets a la plantilla
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
        <div className="flex flex-col gap-4">
          {widgets.map((w) => (
            <WidgetCard
              key={w.type}
              widget={w}
              component={components[w.type]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
