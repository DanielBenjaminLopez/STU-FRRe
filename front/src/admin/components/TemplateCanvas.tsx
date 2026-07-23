import { useDroppable } from "@dnd-kit/core";
import type { WidgetPlacement, WidgetType } from "../pages/plantillas/types";
import { WIDGET_REGISTRY, GRID_COLS, GRID_ROWS } from "../pages/plantillas/types";
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
  const def = WIDGET_REGISTRY[widget.type];
  const Component = WIDGET_COMPONENTS[widget.type];

  return (
    <div
      className="absolute group"
      style={{
        left: `calc(${(widget.col / GRID_COLS) * 100}% + ${(widget.col / GRID_COLS) * 16}px)`,
        top: `calc(${(widget.row / GRID_ROWS) * 100}% + ${(widget.row / GRID_ROWS) * 16}px)`,
        width: `calc(${(def.colSpan / GRID_COLS) * 100}% - ${(def.colSpan / GRID_COLS) * 16 + 16}px)`,
        height: `calc(${(def.rowSpan / GRID_ROWS) * 100}% - ${(def.rowSpan / GRID_ROWS) * 16 + 16}px)`,
      }}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="origin-top-left pointer-events-none" style={{ transform: "scale(0.28)", width: "393%", height: "393%" }}>
          <Component />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(widget.id)}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
        title="Quitar widget"
      >
        <svg className="w-3 h-3 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            className="text-xl font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors px-1 py-0.5"
            placeholder="Nombre plantilla"
          />
          <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Editar nombre">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        <div
          ref={setNodeRef}
          className={`relative w-full aspect-[270/480] bg-white border-2 border-dashed rounded-3xl overflow-hidden transition-colors ${
            isOver ? "border-cyan-300 bg-cyan-50/30" : "border-gray-200"
          }`}
        >
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-4 p-4 pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl" />
            ))}
          </div>

          <div className="absolute inset-0 p-4">
            {widgets.map((w) => (
              <PlacedWidget key={w.id} widget={w} onRemove={onRemoveWidget} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
