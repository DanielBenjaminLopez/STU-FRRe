import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
import Noticias from "../../shared/components/widgets/Noticias";
import { AdminTemplatesSkeleton } from "../../shared/components/ui/Skeleton";
import { fetchWidgets } from "../../shared/api/widgets";
import { updateTotem } from "../../shared/api/totems";
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
  noticias: Noticias,
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
  pointerPos?: { x: number; y: number } | null,
): { col: number; row: number } | null {
  const gridEl = document.querySelector<HTMLDivElement>("[data-grid]");
  if (!gridEl) return null;

  const rect = gridEl.getBoundingClientRect();
  const scale = rect.width / (gridEl.offsetWidth || 1);
  const gap = 32 * scale; // gap-4 con --spacing 0.5rem (2x) = 32px, escalado con el canvas
  const cellW = (rect.width - (GRID_COLS - 1) * gap) / GRID_COLS;
  const cellH = (rect.height - (GRID_ROWS - 1) * gap) / GRID_ROWS;

  const pointer =
    event.activatorEvent instanceof PointerEvent ? event.activatorEvent : null;

  let pointerX =
    pointerPos?.x ?? (pointer ? pointer.clientX + (event.delta?.x ?? 0) : null);
  let pointerY =
    pointerPos?.y ?? (pointer ? pointer.clientY + (event.delta?.y ?? 0) : null);
  if (pointerX === null || pointerY === null) return null;

  // When moving an existing widget, preserve the point where it was grabbed
  // instead of treating that point as the widget's top-left corner.
  const initialRect = event.active.rect.current.initial;
  const widgetId = event.active.data.current?.widgetId;
  if (widgetId && initialRect && pointer) {
    pointerX -= pointer.clientX - initialRect.left;
    pointerY -= pointer.clientY - initialRect.top;
  }

  const x = pointerX - rect.left;
  const y = pointerY - rect.top;

  // A CSS grid position is a track plus its following gap. Do not let a
  // pointer over a gap select the next track prematurely.
  const col = Math.floor(x / (cellW + gap));
  const row = Math.floor(y / (cellH + gap));

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
  const gap = 32; // gap-4 con --spacing 0.5rem (2x) = 32px
  const layoutW = rect.width / scale;
  const layoutH = rect.height / scale;
  const cellW = (layoutW - (GRID_COLS - 1) * gap) / GRID_COLS;
  const cellH = (layoutH - (GRID_ROWS - 1) * gap) / GRID_ROWS;

  const width = def.colSpan * cellW + (def.colSpan - 1) * gap;
  const height = def.rowSpan * cellH + (def.rowSpan - 1) * gap;

  return { width, height };
}

interface DynamicPillInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function DynamicPillInput({
  value,
  onChange,
  onSave,
  onCancel,
}: DynamicPillInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useLayoutEffect(() => {
    if (spanRef.current) {
      setWidth(Math.ceil(spanRef.current.getBoundingClientRect().width));
    }
  }, [value]);

  return (
    <div className="relative inline-flex items-center">
      <span
        ref={spanRef}
        aria-hidden="true"
        className="invisible absolute left-0 top-0 whitespace-pre text-sm font-medium pointer-events-none select-none"
      >
        {value || " "}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={onSave}
        onClick={(e) => e.stopPropagation()}
        style={{ width: width > 0 ? `${width + 4}px` : "auto" }}
        className="bg-transparent text-sm font-medium outline-none p-0 text-inherit"
        aria-label="Editar nombre de plantilla"
      />
    </div>
  );
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
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

  const { selectedTotem, refreshTotems } = useTotem();
  const location = useLocation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  const selected = plantillas.find((p) => p.id === selectedId);
  const isAplicada = Boolean(
    selectedTotem &&
    selected &&
    !selected.isNew &&
    selectedTotem.plantilla_id === Number(selected.id),
  );

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
    // Do not replace the template currently being edited. In particular, a
    // newly created template is marked dirty immediately, and this effect
    // also runs whenever its name or widgets change.
    if (selectedId && dirtyIds[selectedId]) return;

    const targetId = selectedTotem?.plantilla_id
      ? String(selectedTotem.plantilla_id)
      : "";
    if (targetId && plantillas.some((p) => p.id === targetId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(targetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTotem?.plantilla_id, plantillas]);

  useEffect(() => {
    if (
      location.state?.recienVinculado &&
      selectedTotem &&
      !selectedTotem.plantilla_id
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToast(
        "El tótem aún no tiene plantilla asignada. Creá una o seleccioná una y usá 'Aplicar'.",
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

  const handleStartRename = useCallback((plantilla: Plantilla) => {
    setSelectedId(plantilla.id);
    setEditingId(plantilla.id);
    setEditingName(plantilla.nombre);
  }, []);

  const handleSaveRename = useCallback(
    (id: string) => {
      setEditingId((currentEditingId) => {
        if (currentEditingId === id) {
          const trimmed = editingName.trim();
          if (trimmed) {
            setPlantillas((prev) =>
              prev.map((p) => {
                if (p.id === id && p.nombre !== trimmed) {
                  markDirty(id);
                  return { ...p, nombre: trimmed };
                }
                return p;
              }),
            );
          }
        }
        return null;
      });
    },
    [editingName, markDirty],
  );

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  const [prevSelectedId, setPrevSelectedId] = useState(selectedId);
  if (prevSelectedId !== selectedId) {
    setPrevSelectedId(selectedId);
    setSelectedWidgetId(null);
  }

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      updateSelectedPlantilla((p) => ({
        ...p,
        widgets: p.widgets.filter((w) => w.id !== widgetId),
      }));
      setSelectedWidgetId((cur) => (cur === widgetId ? null : cur));
    },
    [updateSelectedPlantilla],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const rawCell = getCellFromEvent(event, pointerPosRef.current);
      if (!rawCell) {
        setHoverCell(null);
        return;
      }
      const widgetType = (event.active.data.current?.widgetType ??
        event.active.data.current?.type) as WidgetType | undefined;
      const def = widgetType ? effectiveRegistry[widgetType] : null;
      if (def) {
        setHoverCell({
          col: Math.max(0, Math.min(rawCell.col, GRID_COLS - def.colSpan)),
          row: Math.max(0, Math.min(rawCell.row, GRID_ROWS - def.rowSpan)),
        });
      } else {
        setHoverCell(rawCell);
      }
    },
    [effectiveRegistry],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveType(null);
      setHoverCell(null);
      setSelectedWidgetId(null);

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

      const cell = getCellFromEvent(event, pointerPosRef.current);
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
    (event: {
      active: { data: { current: unknown } };
      activatorEvent?: Event;
    }) => {
      if (event.activatorEvent instanceof PointerEvent) {
        pointerPosRef.current = {
          x: event.activatorEvent.clientX,
          y: event.activatorEvent.clientY,
        };
      }
      const data = event.active.data.current as
        | Record<string, unknown>
        | undefined;
      const type = (data?.widgetType ?? data?.type) as WidgetType | undefined;
      setSelectedWidgetId(null);
      setActiveType(type ?? null);
    },
    [],
  );

  const handleDragCancel = useCallback(() => {
    setActiveType(null);
    setHoverCell(null);
    setSelectedWidgetId(null);
  }, []);

  const handleClearWidgets = useCallback(() => {
    if (!selected || selected.widgets.length === 0) return;
    updateSelectedPlantilla((p) => ({
      ...p,
      widgets: [],
    }));
    setSelectedWidgetId(null);
  }, [selected, updateSelectedPlantilla]);

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
        const updatedDto = await replacePlantillaWidgets(dto.id, positions);
        const saved = plantillaDTOToLocal(updatedDto);
        setPlantillas((prev) =>
          prev.map((p) => (p.id === plantilla.id ? saved : p)),
        );
        setSelectedId(saved.id);
        if (selectedTotem) {
          await updateTotem(selectedTotem.id, {
            plantilla_id: Number(saved.id),
          });
          await refreshTotems();
        }
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
  }, [
    plantillas,
    selectedId,
    saving,
    widgetIdByTipo,
    selectedTotem,
    refreshTotems,
  ]);

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
      setEditingId((cur) => (cur === deletingId ? null : cur));
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

  const handleCargarAlTotem = useCallback(async () => {
    if (!selectedTotem) return;
    const selected = plantillas.find((p) => p.id === selectedId);
    if (!selected || selected.isNew) return;
    if (dirtyIds[selected.id]) {
      setToast("Guardá la plantilla antes de aplicarla al tótem.");
      return;
    }
    try {
      await updateTotem(selectedTotem.id, {
        plantilla_id: Number(selected.id),
      });
      await refreshTotems();
      setToast("Plantilla aplicada al tótem correctamente");
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : "No se pudo aplicar la plantilla al tótem",
      );
    }
  }, [selectedTotem, plantillas, selectedId, dirtyIds, refreshTotems]);

  if (loading) {
    return <AdminTemplatesSkeleton />;
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
            components={WIDGET_COMPONENTS}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TemplateCanvas
              widgets={selected?.widgets ?? []}
              onRemoveWidget={handleRemoveWidget}
              onScaleChange={setCanvasScale}
              hoverCell={hoverCell}
              activeType={activeType}
              registry={effectiveRegistry}
              selectedWidgetId={selectedWidgetId}
              onSelectWidget={setSelectedWidgetId}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 h-16 bg-white border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            {plantillas.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                aria-pressed={p.id === selectedId}
                onClick={() => setSelectedId(p.id)}
                onDoubleClick={() => handleStartRename(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (editingId !== p.id) {
                      setSelectedId(p.id);
                    }
                  }
                }}
                title={
                  editingId === p.id ? undefined : "Doble clic para renombrar"
                }
                className={`group px-4 py-2 text-sm font-medium rounded-2xl transition-colors flex items-center gap-2 cursor-pointer select-none ${
                  p.id === selectedId
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {editingId === p.id ? (
                  <DynamicPillInput
                    value={editingName}
                    onChange={setEditingName}
                    onSave={() => handleSaveRename(p.id)}
                    onCancel={handleCancelRename}
                  />
                ) : (
                  <span>{p.nombre}</span>
                )}

                {dirtyIds[p.id] && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${p.id === selectedId ? "bg-amber-300" : "bg-amber-500"}`}
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleCreatePlantilla}
              title="Nueva plantilla"
              aria-label="Nueva plantilla"
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-colors shrink-0"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearWidgets}
              disabled={!selected || selected.widgets.length === 0}
              className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Limpiar planilla"
              aria-label="Limpiar planilla"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setDeletingId(selectedId)}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
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
            <div className="h-5 w-px bg-gray-200 mx-1" />
            <button
              type="button"
              onClick={handleCargarAlTotem}
              disabled={
                !selectedTotem || !selected || selected.isNew || isAplicada
              }
              title={
                isAplicada
                  ? "Esta plantilla ya está aplicada al tótem seleccionado"
                  : !selectedTotem
                    ? "Seleccioná un tótem primero"
                    : selected?.isNew
                      ? "Guardá la plantilla antes de aplicarla"
                      : "Aplicar al tótem seleccionado"
              }
              className={`px-5 py-2 text-sm font-medium rounded-2xl border transition-colors ${
                isAplicada
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                  : "bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {isAplicada ? "Aplicada" : "Aplicar"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeType &&
          (() => {
            const RealWidget = WIDGET_COMPONENTS[activeType];
            const def = effectiveRegistry[activeType];
            const dims = getGhostDimensions(
              canvasScale,
              activeType,
              effectiveRegistry,
            );
            if (!RealWidget || !dims || !def) return null;
            return (
              <div
                className="totem-scale-stage pointer-events-none rounded-4xl overflow-hidden opacity-90 transition-opacity grid"
                style={{
                  width: dims.width,
                  height: dims.height,
                  gridTemplateColumns: `repeat(${def.colSpan}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${def.rowSpan}, minmax(0, 1fr))`,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: "top left",
                  willChange: "transform",
                  overflow: "hidden",
                }}
              >
                <RealWidget />
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
        <div className="fixed bottom-20 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}
    </DndContext>
  );
}
