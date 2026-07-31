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
                className={`flex flex-col gap-1 p-4 text-left border rounded-2xl transition-all ${
                  isSelected
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(String(t.id))}
                  className="flex flex-col gap-1 text-left w-full"
                >
                  <span className="flex items-center gap-1 text-sm font-semibold text-gray-900 truncate">
                    {t.nombre || `Tótem #${t.id}`}
                    {isSelected && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-900 text-white shrink-0">
                        Actual
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {t.espacio_nombre || "Sin ubicación"}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {t.plantilla?.nombre || "Sin plantilla"}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        t.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.activo ? "Activo" : "Inactivo"}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        t.vinculado
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.vinculado ? "Vinculado" : "Sin vincular"}
                    </span>
                  </div>
                </button>

                {t.vinculado && (
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => handleEdit(t)}
                      className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl py-1.5 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      title="Eliminar"
                      onClick={() => {
                        setError("");
                        setDeleting(t);
                      }}
                      className="flex-1 text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-xl py-1.5 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {totems.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No hay tótems
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/admin/vincular"
            className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Vincular nuevo tótem
          </Link>
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
