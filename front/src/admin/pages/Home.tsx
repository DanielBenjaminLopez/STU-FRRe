import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTotem } from "../../shared/context/TotemContext";
import TotemPreview from "../components/TotemPreview";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import {
  deleteTotem,
  fetchEspacios,
  updateTotem,
  type Espacio,
  type Totem,
} from "../../shared/api/totems";
import {
  fetchPlantillas,
  type PlantillaDTO,
} from "../../shared/api/plantillas";

export default function Home() {
  const { totems, selectedId, setSelectedId, refreshTotems } = useTotem();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaDTO[]>([]);
  const [editing, setEditing] = useState<Totem | null>(null);
  const [deleting, setDeleting] = useState<Totem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchEspacios().catch(() => []),
      fetchPlantillas().catch(() => []),
    ]).then(([espaciosResult, plantillasResult]) => {
      setEspacios(espaciosResult as Espacio[]);
      setPlantillas(plantillasResult as PlantillaDTO[]);
    });
  }, []);

  const sortedTotems = [...totems].sort((a, b) =>
    String(a.id) === selectedId ? -1 : String(b.id) === selectedId ? 1 : 0,
  );

  const espacioOptions = espacios.map((e) => ({
    value: e.id,
    label: `${e.nombre} - Piso ${e.piso} (${e.tipo})`,
  }));

  const plantillaOptions = plantillas.map((p) => ({
    value: p.id,
    label: p.nombre,
  }));

  const editFields: FormField[] = [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    {
      name: "espacio_id",
      label: "Espacio",
      type: "select",
      options: espacioOptions,
    },
    {
      name: "activo",
      label: "",
      type: "checkbox",
      placeholder: "Tótem activo",
    },
    {
      name: "plantilla_id",
      label: "Plantilla asignada",
      type: "select",
      options: plantillaOptions,
    },
  ];

  function handleEdit(totem: Totem) {
    setError("");
    setEditing(totem);
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editing) return;
    try {
      setError("");
      await updateTotem(editing.id, {
        nombre: String(data.nombre ?? ""),
        espacio_id: data.espacio_id ? Number(data.espacio_id) : null,
        activo: Boolean(data.activo),
        plantilla_id: data.plantilla_id ? Number(data.plantilla_id) : null,
      });
      setEditing(null);
      await refreshTotems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el tótem",
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    try {
      setError("");
      await deleteTotem(deleting.id);
      setDeleting(null);
      await refreshTotems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el tótem",
      );
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 h-full overflow-hidden">
        <TotemPreview />
      </div>

      <div className="w-56 shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Tótems
        </h3>

        <Link
          to="/admin/vincular"
          className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors mb-3"
        >
          Vincular nuevo tótem
        </Link>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {sortedTotems.map((t) => {
            const isSelected = String(t.id) === selectedId;
            return (
              <div
                key={t.id}
                className={`flex flex-col rounded-2xl border transition-all ${
                  isSelected
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(String(t.id))}
                  className="flex flex-col gap-2 p-4 text-left w-full"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        t.activo ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {t.nombre || `Tótem #${t.id}`}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-900 text-white shrink-0">
                        Actual
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3 h-3 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-xs text-gray-500 truncate">
                      {t.espacio_nombre || "Sin ubicación"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3 h-3 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                    <span className="text-xs text-gray-500 truncate">
                      {t.plantilla?.nombre || "Sin plantilla"}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <span
                      className={`inline-flex items-center text-[10px] font-medium px-2.5 py-1 rounded-full ${
                        t.vinculado
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {t.vinculado ? "Vinculado" : "Sin vincular"}
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] font-medium px-2.5 py-1 rounded-full ${
                        t.activo
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {t.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </button>

                <div className="flex border-t border-gray-100">
                  {t.vinculado && (
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => handleEdit(t)}
                      className="flex-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 py-2 transition-colors rounded-bl-2xl"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => {
                      setError("");
                      setDeleting(t);
                    }}
                    className={`flex-1 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 py-2 transition-colors ${
                      t.vinculado ? "" : "rounded-bl-2xl"
                    } rounded-br-2xl`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}

          {totems.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No hay tótems
            </p>
          )}
        </div>
      </div>

      {editing && (
        <DataFormModal
          title="Editar tótem"
          fields={editFields}
          initialData={{
            ...editing,
            espacio_id: editing.espacio_id ?? "",
            plantilla_id: editing.plantilla_id ?? "",
          }}
          onSubmit={handleUpdate}
          onClose={() => {
            setEditing(null);
            setError("");
          }}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title="Eliminar tótem"
          itemName={deleting.nombre || `Tótem #${deleting.id}`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
