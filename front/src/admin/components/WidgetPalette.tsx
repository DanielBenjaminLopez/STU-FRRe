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
      className={`flex flex-col items-center gap-3 cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="origin-top-left pointer-events-none" style={{ transform: "scale(0.28)", width: "393%", height: "393%" }}>
          <Component />
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">
        {widget.label} ({widget.colSpan}&times;{widget.rowSpan})
      </span>
    </div>
  );
}

interface WidgetPaletteProps {
  widgets: WidgetDefinition[];
  components: Record<WidgetType, ComponentType>;
}

export default function WidgetPalette({ widgets, components }: WidgetPaletteProps) {
  return (
    <div className="w-80 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">
          Agregar elementos
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-6">
          {widgets.map((w) => (
            <WidgetCard key={w.type} widget={w} component={components[w.type]} />
          ))}
        </div>
      </div>
    </div>
  );
}
