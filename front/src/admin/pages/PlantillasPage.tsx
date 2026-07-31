import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import WidgetPalette from "../components/WidgetPalette";
import TemplateCanvas from "../components/TemplateCanvas";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import Calendar from "../../shared/components/widgets/Calendar";
import Mapa from "../../shared/components/widgets/Mapa";
import { useTotem } from "../../shared/context/TotemContext";
import {
  WIDGET_REGISTRY,
  GRID_COLS,
  GRID_ROWS,
  checkCollision,
  type WidgetType,
  type WidgetPlacement,
  type Plantilla,
} from "./plantillas/types";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
  calendario: Calendar,
  mapa: Mapa,
};

const STORAGE_KEY = "plantillas";
const ACTIVAS_KEY = "plantillas_activas";

function makeId(): string {
  return (
    crypto.randomUUID?.() ??
    `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

function createEmptyPlantilla(): Plantilla {
  return {
    id: makeId(),
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

function loadActiveMapping(): Record<string, string> {
  try {
    const saved = localStorage.getItem(ACTIVAS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
}

function saveActiveMapping(mapping: Record<string, string>) {
  localStorage.setItem(ACTIVAS_KEY, JSON.stringify(mapping));
}

function getCellFromEvent(
  event: DragOverEvent,
): { col: number; row: number } | null {
  const gridEl = document.querySelector<HTMLDivElement>("[data-grid]");
  if (!gridEl) return null;

  const rect = gridEl.getBoundingClientRect();
  const scale = rect.width / (gridEl.offsetWidth || 1);
  const gap = 16 * scale; // gap-4 = 16px, escalado con el canvas
  const cellW = (rect.width - (GRID_COLS - 1) * gap) / GRID_COLS;
  const cellH = (rect.height - (GRID_ROWS - 1) * gap) / GRID_ROWS;

  const pointer =
    event.activatorEvent instanceof PointerEvent ? event.activatorEvent : null;
  if (!pointer) return null;

  const x = pointer.clientX - rect.left + (event.delta?.x ?? 0);
  const y = pointer.clientY - rect.top + (event.delta?.y ?? 0);

  const col = Math.floor(x / cellW);
  const row = Math.floor(y / cellH);

  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
  return { col, row };
}

function getGhostDimensions(
  scale: number,
  activeType: WidgetType | null,
): { width: number; height: number } | null {
  const gridEl = document.querySelector<HTMLDivElement>("[data-grid]");
  if (!gridEl || !activeType) return null;

  const def = WIDGET_REGISTRY[activeType];
  if (!def) return null;

  const rect = gridEl.getBoundingClientRect();
  const gap = 16; // gap-4 = 16px
  const layoutW = rect.width / scale;
  const layoutH = rect.height / scale;
  const cellW = (layoutW - (GRID_COLS - 1) * gap) / GRID_COLS;
  const cellH = (layoutH - (GRID_ROWS - 1) * gap) / GRID_ROWS;

  const width = def.colSpan * cellW + (def.colSpan - 1) * gap;
  const height = def.rowSpan * cellH + (def.rowSpan - 1) * gap;

  return { width, height };
}

export default function PlantillasPage() {
  const { selectedId: totemId } = useTotem();
  const [plantillas, setPlantillas] = useState<Plantilla[]>(loadPlantillas);
  const [selectedId, setSelectedId] = useState<string>(
    () => plantillas[0]?.id ?? "",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<WidgetType | null>(null);
  const [hoverCell, setHoverCell] = useState<{
    col: number;
    row: number;
  } | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const selected = plantillas.find((p) => p.id === selectedId);
  const activeMapping = loadActiveMapping();
  const activePlantillaId = totemId ? (activeMapping[totemId] ?? null) : null;

  useEffect(() => {
    savePlantillas(plantillas);
  }, [plantillas]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setHoverCell(getCellFromEvent(event));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveType(null);
      setHoverCell(null);

      const { active } = event;
      const moveWidgetId = active.data.current?.widgetId as string | undefined;
      const widgetType = (
        moveWidgetId
          ? active.data.current?.widgetType
          : active.data.current?.type
      ) as WidgetType | undefined;
      if (!widgetType) return;

      const def = WIDGET_REGISTRY[widgetType];
      if (!def) return;

      const cell = getCellFromEvent(event);
      if (!cell) {
        setToast("Soltá el widget dentro de la grilla de la plantilla");
        return;
      }

      const col = Math.max(0, Math.min(cell.col, GRID_COLS - def.colSpan));
      const row = Math.max(0, Math.min(cell.row, GRID_ROWS - def.rowSpan));

      const currentWidgets =
        plantillas.find((p) => p.id === selectedId)?.widgets ?? [];

      const widgetsToCheck = moveWidgetId
        ? currentWidgets.filter((w) => w.id !== moveWidgetId)
        : currentWidgets;

      if (checkCollision(widgetsToCheck, col, row, def.colSpan, def.rowSpan)) {
        setToast("No hay espacio disponible en esa posición");
        return;
      }

      if (moveWidgetId) {
        setPlantillas((prev) =>
          prev.map((p) =>
            p.id === selectedId
              ? {
                  ...p,
                  widgets: p.widgets.map((w) =>
                    w.id === moveWidgetId ? { ...w, col, row } : w,
                  ),
                }
              : p,
          ),
        );
      } else {
        const newWidget: WidgetPlacement = {
          id: makeId(),
          type: widgetType,
          col,
          row,
        };
        setPlantillas((prev) =>
          prev.map((p) =>
            p.id === selectedId
              ? { ...p, widgets: [...p.widgets, newWidget] }
              : p,
          ),
        );
      }
    },
    [selectedId, plantillas],
  );

  const handleDragStart = useCallback(
    (event: { active: { data: { current: unknown } } }) => {
      const data = event.active.data.current as
        | Record<string, unknown>
        | undefined;
      const type = (data?.widgetType ?? data?.type) as WidgetType | undefined;
      setActiveType(type ?? null);
    },
    [],
  );

  const handleDragCancel = useCallback(() => {
    setActiveType(null);
    setHoverCell(null);
  }, []);

  const handleCreatePlantilla = useCallback(() => {
    const newP = createEmptyPlantilla();
    setPlantillas((prev) => [...prev, newP]);
    setSelectedId(newP.id);
  }, []);

  const handleDeletePlantilla = useCallback(async () => {
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

  const handleLoadOnTotem = useCallback(() => {
    if (!totemId || !selectedId) return;
    const mapping = loadActiveMapping();
    saveActiveMapping({ ...mapping, [totemId]: selectedId });
    setToast("Plantilla cargada en el tótem correctamente");
  }, [totemId, selectedId]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragMove={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden">
          <WidgetPalette
            widgets={Object.values(WIDGET_REGISTRY)}
            components={{
              horarios: Horarios,
              examenes: Examenes,
              calendario: Calendar,
              mapa: Mapa,
            }}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TemplateCanvas
              widgets={selected?.widgets ?? []}
              nombre={selected?.nombre ?? ""}
              onNombreChange={handleNombreChange}
              onRemoveWidget={handleRemoveWidget}
              onScaleChange={setCanvasScale}
              hoverCell={hoverCell}
              activeType={activeType}
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
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 ${
                  p.id === selectedId
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.nombre}
                {p.id === activePlantillaId && (
                  <span
                    className={`text-[10px] ${p.id === selectedId ? "text-green-400" : "text-green-600"}`}
                  >
                    ✓
                  </span>
                )}
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleLoadOnTotem}
              className="px-5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cargar en tótem
            </button>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeType &&
          (() => {
            const Ghost = WIDGET_COMPONENTS[activeType];
            const dims = getGhostDimensions(canvasScale, activeType);
            if (!Ghost || !dims) return null;
            return (
              <div
                className="pointer-events-none"
                style={{
                  width: dims.width,
                  height: dims.height,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: "top left",
                  overflow: "hidden",
                }}
              >
                <Ghost />
              </div>
            );
          })()}
      </DragOverlay>

      {deletingId && (
        <ConfirmDeleteModal
          title="Eliminar plantilla"
          itemName={
            plantillas.find((p) => p.id === deletingId)?.nombre ?? "plantilla"
          }
          onConfirm={handleDeletePlantilla}
          onClose={() => setDeletingId(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}
    </DndContext>
  );
}
