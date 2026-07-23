import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import WidgetPalette from "../components/WidgetPalette";
import TemplateCanvas from "../components/TemplateCanvas";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import {
  WIDGET_REGISTRY,
  GRID_COLS,
  GRID_ROWS,
  checkCollision,
  type WidgetType,
  type WidgetPlacement,
  type Plantilla,
} from "./plantillas/types";

const STORAGE_KEY = "plantillas";

function createEmptyPlantilla(): Plantilla {
  return {
    id: crypto.randomUUID(),
    nombre: "Nueva plantilla",
    widgets: [],
  };
}

function loadPlantillas(): Plantilla[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [createEmptyPlantilla()];
}

function savePlantillas(plantillas: Plantilla[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantillas));
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>(loadPlantillas);
  const [selectedId, setSelectedId] = useState<string>(() => plantillas[0]?.id ?? "");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<WidgetType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const selected = plantillas.find((p) => p.id === selectedId);

  useEffect(() => {
    savePlantillas(plantillas);
  }, [plantillas]);

  useEffect(() => {
    if (!selectedId && plantillas.length > 0) {
      setSelectedId(plantillas[0].id);
    }
  }, [selectedId, plantillas]);

  const handleNombreChange = useCallback(
    (nombre: string) => {
      setPlantillas((prev) =>
        prev.map((p) => (p.id === selectedId ? { ...p, nombre } : p)),
      );
    },
    [selectedId],
  );

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      setPlantillas((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? { ...p, widgets: p.widgets.filter((w) => w.id !== widgetId) }
            : p,
        ),
      );
    },
    [selectedId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveType(null);
      const { over, active } = event;
      if (!over || over.id !== "canvas") return;

      const widgetType = active.data.current?.type as WidgetType | undefined;
      if (!widgetType) return;

      const def = WIDGET_REGISTRY[widgetType];
      if (!def) return;

      const canvasEl = document.querySelector<HTMLDivElement>("[data-canvas]");
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const cellW = rect.width / GRID_COLS;
      const cellH = rect.height / GRID_ROWS;

      const pointer = event.activatorEvent instanceof PointerEvent
        ? event.activatorEvent
        : null;
      if (!pointer) return;

      const x = pointer.clientX - rect.left + (event.delta?.x ?? 0);
      const y = pointer.clientY - rect.top + (event.delta?.y ?? 0);

      let col = Math.floor(x / cellW);
      let row = Math.floor(y / cellH);

      col = Math.max(0, Math.min(col, GRID_COLS - def.colSpan));
      row = Math.max(0, Math.min(row, GRID_ROWS - def.rowSpan));

      const currentWidgets =
        plantillas.find((p) => p.id === selectedId)?.widgets ?? [];
      if (checkCollision(currentWidgets, col, row, def.colSpan, def.rowSpan)) return;

      const newWidget: WidgetPlacement = {
        id: crypto.randomUUID(),
        type: widgetType,
        col,
        row,
      };

      setPlantillas((prev) =>
        prev.map((p) =>
          p.id === selectedId ? { ...p, widgets: [...p.widgets, newWidget] } : p,
        ),
      );
    },
    [selectedId, plantillas],
  );

  const handleDragStart = useCallback((event: { active: { data: { current: unknown } } }) => {
    setActiveType((event.active.data.current as { type?: WidgetType })?.type ?? null);
  }, []);

  const handleCreatePlantilla = useCallback(() => {
    const newP = createEmptyPlantilla();
    setPlantillas((prev) => [...prev, newP]);
    setSelectedId(newP.id);
  }, []);

  const handleDeletePlantilla = useCallback(() => {
    if (!deletingId) return;
    setPlantillas((prev) => {
      const next = prev.filter((p) => p.id !== deletingId);
      if (next.length === 0) {
        const empty = createEmptyPlantilla();
        setSelectedId(empty.id);
        return [empty];
      }
      if (selectedId === deletingId) {
        setSelectedId(next[0].id);
      }
      return next;
    });
    setDeletingId(null);
  }, [deletingId, selectedId]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden">
          <WidgetPalette
            widgets={Object.values(WIDGET_REGISTRY)}
            components={{ horarios: Horarios, examenes: Examenes }}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TemplateCanvas
              widgets={selected?.widgets ?? []}
              nombre={selected?.nombre ?? ""}
              onNombreChange={handleNombreChange}
              onRemoveWidget={handleRemoveWidget}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            {plantillas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                  p.id === selectedId
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.nombre}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCreatePlantilla}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2">
            {plantillas.length > 1 && (
              <button
                type="button"
                onClick={() => setDeletingId(selectedId)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Eliminar plantilla"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="px-5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeType && (
          <div className="px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-lg text-sm font-medium text-gray-700 opacity-90">
            {WIDGET_REGISTRY[activeType].label}
          </div>
        )}
      </DragOverlay>

      {deletingId && (
        <ConfirmDeleteModal
          title="Eliminar plantilla"
          itemName={plantillas.find((p) => p.id === deletingId)?.nombre ?? "plantilla"}
          onConfirm={handleDeletePlantilla}
          onClose={() => setDeletingId(null)}
        />
      )}
    </DndContext>
  );
}
