import { useDroppable } from "@dnd-kit/core";
import type { WidgetPlacement, WidgetType } from "../pages/plantillas/types";
import { WIDGET_REGISTRY } from "../pages/plantillas/types";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
};

interface PlacedWidgetProps {
  widget: WidgetPlacement;
  onRemove: (id: string) => void;
}

function PlacedWidget({ widget, onRemove }: PlacedWidgetProps) {
  const Component = WIDGET_COMPONENTS[widget.type];

  return (
    <div className="relative group" style={{ gridColumn: `${widget.col + 1} / span ${WIDGET_REGISTRY[widget.type].colSpan}`, gridRow: `${widget.row + 1} / span ${WIDGET_REGISTRY[widget.type].rowSpan}` }}>
      <Component />
      <button
        type="button"
        onClick={() => onRemove(widget.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200 z-10"
        title="Quitar widget"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface TemplateCanvasProps {
  widgets: WidgetPlacement[];
  nombre: string;
  onNombreChange: (nombre: string) => void;
  onRemoveWidget: (id: string) => void;
}

export default function TemplateCanvas({
  widgets,
  nombre,
  onNombreChange,
  onRemoveWidget,
}: TemplateCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto p-8">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <input
          type="text"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          className="text-xl font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors px-1 py-0.5 w-fit"
          placeholder="Nombre plantilla"
        />

        <div
          ref={setNodeRef}
          data-canvas
          className={`relative w-full aspect-[270/480] bg-white border-2 border-dashed rounded-3xl overflow-hidden transition-colors ${
            isOver ? "border-cyan-300 bg-cyan-50/30" : "border-gray-200"
          }`}
        >
          <div className="w-full h-full grid grid-cols-4 grid-rows-6 gap-4 p-4">
            {widgets.map((w) => (
              <PlacedWidget key={w.id} widget={w} onRemove={onRemoveWidget} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
