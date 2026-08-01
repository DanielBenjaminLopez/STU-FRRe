import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
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
import { fetchWidgets } from "../../shared/api/widgets";
import { useTotem } from "../../shared/context/TotemContext";
import {
  createPlantilla,
  deletePlantilla,
  fetchPlantillas,
  replacePlantillaWidgets,
  updatePlantilla,
} from "../../shared/api/plantillas";
import {
  WIDGET_REGISTRY,
  buildEffectiveRegistry,
  GRID_COLS,
  GRID_ROWS,
  checkCollision,
  plantillaDTOToLocal,
  plantillaToWidgetPositions,
  type WidgetType,
  type WidgetDefinition,
  type WidgetPlacement,
  type Plantilla,
} from "./plantillas/types";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
  calendario: Calendar,
  mapa: Mapa,
};

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
    isNew: true,
  };
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
  registry: Record<WidgetType, WidgetDefinition>,
): { width: number; height: number } | null {
  const gridEl = document.querySelector<HTMLDivElement>("[data-grid]");
  if (!gridEl || !activeType) return null;

  const def = registry[activeType];
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
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<WidgetType | null>(null);
  const [hoverCell, setHoverCell] = useState<{
    col: number;
    row: number;
  } | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [widgetIdByTipo, setWidgetIdByTipo] = useState<
    Partial<Record<WidgetType, number>>
  >({});
  const [dirtyIds, setDirtyIds] = useState<Record<string, boolean>>({});
  const [effectiveRegistry, setEffectiveRegistry] = useState<
    Record<WidgetType, WidgetDefinition>
  >({} as Record<WidgetType, WidgetDefinition>);

  const { selectedTotem } = useTotem();
  const location = useLocation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const selected = plantillas.find((p) => p.id === selectedId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dtos, widgets] = await Promise.all([
          fetchPlantillas(),
          fetchWidgets(),
        ]);
        if (cancelled) return;
        const byTipo: Partial<Record<WidgetType, number>> = {};
        for (const w of widgets) {
          if (w.tipo in WIDGET_REGISTRY) byTipo[w.tipo as WidgetType] = w.id;
        }
        const local = dtos.map(plantillaDTOToLocal);
        setWidgetIdByTipo(byTipo);
        setPlantillas(local);
        setSelectedId(local[0]?.id ?? "");
        setEffectiveRegistry(buildEffectiveRegistry(widgets));
      } catch {
        if (!cancelled) setToast("No se pudieron cargar las plantillas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (plantillas.length === 0) return;
    const targetId = selectedTotem?.plantilla_id
      ? String(selectedTotem.plantilla_id)
      : "";
    if (targetId && plantillas.some((p) => p.id === targetId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(targetId);
    }
  }, [selectedTotem?.plantilla_id, plantillas]);

  useEffect(() => {
    if (
      location.state?.recienVinculado &&
      selectedTotem &&
      !selectedTotem.plantilla_id
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToast(
        "El tótem aún no tiene plantilla asignada. Creá una o seleccioná una y usá 'Cargar al tótem'.",
      );
    }
  }, [location.state, selectedTotem]);

  const markDirty = useCallback((id: string) => {
    setDirtyIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const updateSelectedPlantilla = useCallback(
    (updater: (p: Plantilla) => Plantilla) => {
      setPlantillas((prev) =>
        prev.map((p) => (p.id === selectedId ? updater(p) : p)),
      );
      markDirty(selectedId);
    },
    [selectedId, markDirty],
  );

  const handleNombreChange = useCallback(
    (nombre: string) => {
      updateSelectedPlantilla((p) => ({ ...p, nombre }));
    },
    [updateSelectedPlantilla],
  );

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      updateSelectedPlantilla((p) => ({
        ...p,
        widgets: p.widgets.filter((w) => w.id !== widgetId),
      }));
    },
    [updateSelectedPlantilla],
  );

  const handleResizeWidget = useCallback(
    (widgetId: string, colSpan: number, rowSpan: number) => {
      updateSelectedPlantilla((p) => ({
        ...p,
        widgets: p.widgets.map((w) =>
          w.id === widgetId ? { ...w, colSpan, rowSpan } : w,
        ),
      }));
    },
    [updateSelectedPlantilla],
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

      const def = effectiveRegistry[widgetType];
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
        updateSelectedPlantilla((p) => ({
          ...p,
          widgets: p.widgets.map((w) =>
            w.id === moveWidgetId ? { ...w, col, row } : w,
          ),
        }));
      } else {
        const newWidget: WidgetPlacement = {
          id: makeId(),
          type: widgetType,
          col,
          row,
          colSpan: def.colSpan,
          rowSpan: def.rowSpan,
        };
        updateSelectedPlantilla((p) => ({
          ...p,
          widgets: [...p.widgets, newWidget],
        }));
      }
    },
    [plantillas, selectedId, updateSelectedPlantilla, effectiveRegistry],
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
    setDirtyIds((prev) => ({ ...prev, [newP.id]: true }));
  }, []);

  const handleSave = useCallback(async () => {
    const plantilla = plantillas.find((p) => p.id === selectedId);
    if (!plantilla || saving) return;

    const positions = plantillaToWidgetPositions(plantilla, widgetIdByTipo);
    setSaving(true);
    try {
      if (plantilla.isNew) {
        const dto = await createPlantilla({
          nombre: plantilla.nombre,
          activa: false,
        });
        await replacePlantillaWidgets(dto.id, positions);
        const saved = plantillaDTOToLocal(dto);
        setPlantillas((prev) =>
          prev.map((p) => (p.id === plantilla.id ? saved : p)),
        );
        setSelectedId(saved.id);
      } else {
        const id = Number(plantilla.id);
        await updatePlantilla(id, { nombre: plantilla.nombre });
        const dto = await replacePlantillaWidgets(id, positions);
        const saved = plantillaDTOToLocal(dto);
        setPlantillas((prev) =>
          prev.map((p) => (p.id === plantilla.id ? saved : p)),
        );
      }
      setDirtyIds((prev) => {
        const next = { ...prev };
        delete next[plantilla.id];
        return next;
      });
      setToast("Plantilla guardada correctamente");
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "No se pudo guardar la plantilla",
      );
    } finally {
      setSaving(false);
    }
  }, [plantillas, selectedId, saving, widgetIdByTipo]);

  const handleDeletePlantilla = useCallback(async () => {
    if (!deletingId) return;
    const target = plantillas.find((p) => p.id === deletingId);
    if (!target) {
      setDeletingId(null);
      return;
    }

    try {
      if (!target.isNew) {
        await deletePlantilla(Number(deletingId));
      }
      const next = plantillas.filter((p) => p.id !== deletingId);
      setPlantillas(next);
      if (selectedId === deletingId) {
        setSelectedId(next[0]?.id ?? "");
      }
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "No se pudo eliminar la plantilla",
      );
    }
    setDeletingId(null);
  }, [deletingId, plantillas, selectedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando plantillas...
      </div>
    );
  }

  if (plantillas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">Todavía no hay plantillas</p>
        <button
          type="button"
          onClick={handleCreatePlantilla}
          className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
        >
          Crear plantilla
        </button>
      </div>
    );
  }

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
            widgets={Object.values(effectiveRegistry)}
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
              onResizeWidget={handleResizeWidget}
              onScaleChange={setCanvasScale}
              hoverCell={hoverCell}
              activeType={activeType}
              registry={effectiveRegistry}
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
                {p.isNew && (
                  <span
                    className={`text-[10px] ${p.id === selectedId ? "text-cyan-300" : "text-cyan-600"}`}
                  >
                    nuevo
                  </span>
                )}
                {dirtyIds[p.id] && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${p.id === selectedId ? "bg-amber-300" : "bg-amber-500"}`}
                  />
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
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar plantilla"}
            </button>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeType &&
          (() => {
            const Ghost = WIDGET_COMPONENTS[activeType];
            const dims = getGhostDimensions(
              canvasScale,
              activeType,
              effectiveRegistry,
            );
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
