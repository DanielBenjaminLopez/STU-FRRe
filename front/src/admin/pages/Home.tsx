import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTotem } from "../../shared/context/TotemContext";
import TotemPreview from "../components/TotemPreview";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import VincularTotemModal from "../components/VincularTotemModal";
import { deleteTotem, updateTotem, type Totem } from "../../shared/api/totems";
import Button from "../../shared/components/ui/Button";
import {
  fetchPlantillas,
  type PlantillaDTO,
} from "../../shared/api/plantillas";

export default function Home() {
  const { totems, selectedId, setSelectedId, refreshTotems } = useTotem();

  const [plantillas, setPlantillas] = useState<PlantillaDTO[]>([]);
  const [editing, setEditing] = useState<Totem | null>(null);
  const [deleting, setDeleting] = useState<Totem | null>(null);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlantillas()
      .catch(() => [])
      .then((plantillasResult) => {
        setPlantillas(plantillasResult as PlantillaDTO[]);
      });
  }, []);

  const sortedTotems = [...totems]
    .filter((t) => t.vinculado)
    .sort((a, b) => a.id - b.id);

  const plantillaOptions = plantillas.map((p) => ({
    value: p.id,
    label: p.nombre,
  }));

  const editFields: FormField[] = [
    { name: "nombre", label: "Nombre", type: "text", required: true },
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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <TotemPreview />
      </div>

      <div className="w-56 shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Tótems vinculados
        </h3>

        <Button
          variant="primary"
          className="w-full mb-3"
          onClick={() => {
            setError("");
            setVincularOpen(true);
          }}
        >
          Nuevo tótem
        </Button>

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
                className={`flex flex-col rounded-2xl border transition-colors duration-300 overflow-hidden ${
                  isSelected
                    ? "border-gray-900 bg-white"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(String(t.id))}
                  className="flex flex-col gap-2 p-3.5 text-left w-full cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      <span
                        title={t.activo ? "Activo" : "Inactivo"}
                        aria-label={t.activo ? "Activo" : "Inactivo"}
                        className={`w-2 h-2 rounded-full ${
                          t.activo ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                    </span>
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {t.nombre || `Tótem #${t.id}`}
                    </span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-900 text-white shrink-0"
                        >
                          Actual
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </span>
                    <span className="truncate">
                      {t.plantilla?.nombre || "Sin plantilla"}
                    </span>
                  </div>
                </button>

                <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/70">
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => handleEdit(t)}
                    className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 py-2 transition-colors cursor-pointer"
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
                    className="flex-1 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 py-2 transition-colors cursor-pointer"
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

      {vincularOpen && (
        <VincularTotemModal onClose={() => setVincularOpen(false)} />
      )}
    </div>
  );
}
