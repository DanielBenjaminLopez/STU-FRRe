import { useCallback, useEffect, useState } from "react";
import DataFormModal from "../components/DataFormModal";
import type { FormField } from "../components/DataFormModal";
import {
  fetchUbicacionesMapa,
  updateUbicacionMapa,
  type UbicacionMapa,
  type PisoKey,
} from "../../shared/api/ubicacionesMapa";
import { updateTotemPinMapa } from "../../shared/api/totems";
import MapaRaw, {
  type PinPosition,
} from "../../shared/components/widgets/MapaRaw";
import type { FloorKey } from "../../shared/components/widgets/MapaRaw";
import { useTotem } from "../../shared/context/TotemContext";

const PISOS: { key: PisoKey; label: string }[] = [
  { key: "baja", label: "Planta Baja" },
  { key: "primero", label: "Primer Piso" },
  { key: "segundo", label: "Segundo Piso" },
];

const TIPOS_MAPA = [
  { value: "aula", label: "Aula" },
  { value: "oficina", label: "Oficina" },
  { value: "departamento", label: "Departamento" },
  { value: "secretaria", label: "Secretaría" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "servicio", label: "Servicio" },
  { value: "escaleras", label: "Escaleras" },
  { value: "ascensor", label: "Ascensor" },
  { value: "baños", label: "Baños" },
  { value: "otro", label: "Otro" },
];

const TIPO_COLORS: Record<string, string> = {
  aula: "#93c5fd",
  oficina: "#c4b5fd",
  departamento: "#5eead4",
  secretaria: "#fda4af",
  laboratorio: "#86efac",
  servicio: "#fdba74",
  escaleras: "#a8a29e",
  ascensor: "#d6b370",
  baños: "#67e8f9",
  otro: "#d1d5db",
};

const editFields: FormField[] = [
  {
    name: "nombre",
    label: "Nombre",
    type: "text",
    required: true,
    placeholder: "Nombre de la ubicación",
  },
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    required: true,
    options: TIPOS_MAPA,
  },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function UbicacionesMapaPage() {
  // --- Sección 1: Ubicaciones/polígonos ---
  const [activePiso, setActivePiso] = useState<PisoKey>("baja");
  const [ubicaciones, setUbicaciones] = useState<UbicacionMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<UbicacionMapa | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Sección 2: Pin del tótem activo ---
  // El tótem activo viene del contexto del admin (selector superior de la página)
  const { selectedTotem, totems, refreshTotems } = useTotem();
  const [pinSaveStatus, setPinSaveStatus] = useState<SaveStatus>("idle");
  const [pinError, setPinError] = useState<string | null>(null);

  // El piso del editor: arranca en el piso guardado del tótem (si tiene pin),
  // o en "baja" por defecto. El usuario puede sobreescribirlo manualmente.
  // Se deriva sin useEffect para evitar cascadas de render.
  const defaultEditorFloor =
    (selectedTotem?.pin_mapa_piso as FloorKey) ?? "baja";
  const [editorFloorOverride, setEditorFloor] = useState<FloorKey | null>(null);
  const editorFloor: FloorKey = editorFloorOverride ?? defaultEditorFloor;

  const cargarUbicaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUbicacionesMapa();
      setUbicaciones(data);
    } catch {
      setError("Error al cargar las ubicaciones del mapa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchUbicacionesMapa()
      .then((data) => {
        if (!cancelled) {
          setUbicaciones(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Error al cargar las ubicaciones del mapa.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPinPosition: PinPosition | null =
    selectedTotem?.pin_mapa_piso &&
    selectedTotem.pin_mapa_svg_x !== null &&
    selectedTotem.pin_mapa_svg_y !== null
      ? {
          floor: selectedTotem.pin_mapa_piso as FloorKey,
          svgX: selectedTotem.pin_mapa_svg_x!,
          svgY: selectedTotem.pin_mapa_svg_y!,
        }
      : null;

  const handlePinPlaced = useCallback(
    async (pos: PinPosition) => {
      if (!selectedTotem) return;
      setPinSaveStatus("saving");
      setPinError(null);
      try {
        await updateTotemPinMapa(selectedTotem.id, {
          pin_mapa_piso: pos.floor,
          pin_mapa_svg_x: pos.svgX,
          pin_mapa_svg_y: pos.svgY,
        });
        await refreshTotems();
        setPinSaveStatus("saved");
        setTimeout(() => setPinSaveStatus("idle"), 2500);
      } catch {
        setPinSaveStatus("error");
        setPinError("Error al guardar la posición. Intentá de nuevo.");
      }
    },
    [selectedTotem, refreshTotems],
  );

  const handleClearPin = useCallback(async () => {
    if (!selectedTotem) return;
    setPinSaveStatus("saving");
    setPinError(null);
    try {
      await updateTotemPinMapa(selectedTotem.id, null);
      await refreshTotems();
      setPinSaveStatus("saved");
      setTimeout(() => setPinSaveStatus("idle"), 2500);
    } catch {
      setPinSaveStatus("error");
      setPinError("Error al limpiar la posición.");
    }
  }, [selectedTotem, refreshTotems]);

  const ubicacionesPiso = ubicaciones
    .filter((u) => u.piso === activePiso)
    .filter(
      (u) =>
        !searchQuery ||
        u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.svg_id.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  async function handleEdit(data: Record<string, unknown>) {
    if (!editingItem) return;
    await updateUbicacionMapa(editingItem.id, {
      nombre: String(data.nombre),
      tipo: String(data.tipo),
    });
    await cargarUbicaciones();
  }

  const noTotems = totems.filter((t) => t.vinculado).length === 0;

  return (
    <>
      <div className="flex flex-col h-full gap-8 p-8 overflow-auto">
        {/* ── Sección 1: Polígonos del mapa ── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Mapa de Ubicaciones
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Editá los nombres y tipos de las ubicaciones que aparecen en el
                mapa interactivo del tótem.
              </p>
            </div>
            <div className="text-sm text-gray-400">
              {ubicaciones.length} ubicaciones en total
            </div>
          </div>

          {/* Tabs de pisos */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
            {PISOS.map((piso) => {
              const count = ubicaciones.filter(
                (u) => u.piso === piso.key,
              ).length;
              return (
                <button
                  key={piso.key}
                  id={`tab-piso-${piso.key}`}
                  onClick={() => {
                    setActivePiso(piso.key);
                    setSearchQuery("");
                  }}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    activePiso === piso.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {piso.label}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      activePiso === piso.key
                        ? "bg-gray-100 text-gray-600"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3">
            <input
              id="search-ubicaciones"
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 w-72 bg-white"
            />
            {searchQuery && (
              <span className="text-sm text-gray-400">
                {ubicacionesPiso.length} resultado
                {ubicacionesPiso.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                Cargando ubicaciones...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-40 text-sm text-red-500">
                {error}
              </div>
            ) : ubicacionesPiso.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                {searchQuery
                  ? "No se encontraron ubicaciones que coincidan."
                  : "No hay ubicaciones para este piso."}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500 w-24">
                      ID SVG
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Nombre
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-40">
                      Tipo
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-24 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ubicacionesPiso.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                          {u.svg_id}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {u.nombre}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              (TIPO_COLORS[u.tipo] ?? "#d1d5db") + "55",
                            color: "#374151",
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: TIPO_COLORS[u.tipo] ?? "#d1d5db",
                            }}
                          />
                          {u.tipo_display}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          id={`edit-ubicacion-${u.id}`}
                          onClick={() => setEditingItem(u)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Sección 2: Pin del tótem activo ── */}
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Posición del tótem en el mapa
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Hacé click en el mapa para indicar dónde está el tótem.
              </p>
            </div>

            {/* Feedback + limpiar */}
            <div className="flex items-center gap-3">
              {pinSaveStatus === "saving" && (
                <span className="text-sm text-gray-400 animate-pulse">
                  Guardando...
                </span>
              )}
              {pinSaveStatus === "saved" && (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardado
                </span>
              )}
              {pinSaveStatus === "error" && pinError && (
                <span className="text-sm text-red-500">{pinError}</span>
              )}
              {currentPinPosition && selectedTotem && (
                <button
                  id="btn-limpiar-pin"
                  onClick={handleClearPin}
                  disabled={pinSaveStatus === "saving"}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 disabled:opacity-50"
                >
                  Limpiar pin
                </button>
              )}
            </div>
          </div>

          {noTotems ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400">
              No hay tótems vinculados. Vinculá uno primero.
            </div>
          ) : !selectedTotem ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400">
              Seleccioná un tótem en el panel superior para editar su posición.
            </div>
          ) : (
            <div className="flex gap-4 h-130">
              {/* Selector de pisos — vertical, a la izquierda del mapa */}
              <div className="flex flex-col gap-2 shrink-0">
                {PISOS.map((p) => (
                  <button
                    key={p.key}
                    id={`pin-piso-${p.key}`}
                    onClick={() => setEditorFloor(p.key as FloorKey)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      editorFloor === p.key
                        ? "bg-cyan-100 text-cyan-900 shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Mapa 3D */}
              <div className="flex-1 bg-white/50 rounded-2xl border border-gray-200 overflow-hidden">
                <MapaRaw
                  key={`pin-editor-${selectedTotem.id}`}
                  externalFloor={editorFloor}
                  pinPosition={currentPinPosition}
                  onPinPlaced={handlePinPlaced}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de polígono */}
      {editingItem && (
        <DataFormModal
          title={`Editar — ${editingItem.svg_id}`}
          fields={editFields}
          initialData={{
            nombre: editingItem.nombre,
            tipo: editingItem.tipo,
          }}
          onSubmit={handleEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
}
