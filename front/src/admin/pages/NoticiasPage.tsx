import { useCallback, useEffect, useState } from "react";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import NoticiasCarousel from "../components/NoticiasCarousel";
import {
  fetchFeed,
  createNoticia,
  updateNoticia,
  deleteNoticia,
  syncNoticias,
  type ContenidoFeed,
} from "../../shared/api/noticias";

const columns: Column<Record<string, unknown>>[] = [
  { key: "titulo", label: "Título", sortable: true },
  {
    key: "tipo",
    label: "Tipo",
    sortable: true,
    render: (val, row) => {
      if (val === "evento") {
        const tipoEvento = row.tipo_evento as string | undefined;
        const espacio = row.espacio_nombre as string | undefined;
        const label = ["Evento", tipoEvento, espacio]
          .filter(Boolean)
          .join(" · ");
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
            {label}
          </span>
        );
      }
      const origen = row.origen as string | undefined;
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            origen === "scraping"
              ? "bg-blue-50 text-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {origen === "scraping" ? "Scraping" : "Manual"}
        </span>
      );
    },
  },
  {
    key: "fecha",
    label: "Fecha",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleDateString("es-ES");
    },
  },
  {
    key: "imagen_url",
    label: "Imagen",
    render: (val) => {
      if (!val) return "-";
      return (
        <img
          src={String(val)}
          alt="Miniatura"
          className="w-10 h-10 rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    },
  },
];

const now = new Date();
const oneYear = new Date(now);
oneYear.setFullYear(oneYear.getFullYear() + 1);

const formFields = [
  { name: "titulo", label: "Título", type: "text" as const, required: true },
  {
    name: "contenido",
    label: "Contenido",
    type: "textarea" as const,
    required: true,
  },
  {
    name: "imagen_url",
    label: "URL de imagen (opcional)",
    type: "text" as const,
    required: false,
    placeholder: "https://ejemplo.com/imagen.jpg",
  },
  {
    name: "enlace",
    label: "Enlace a noticia original (opcional)",
    type: "text" as const,
    required: false,
    placeholder: "https://frre.utn.edu.ar/noticias/...",
  },
  {
    name: "fecha_publicacion",
    label: "Fecha de publicación",
    type: "datetime-local" as const,
    required: true,
    defaultValue: now.toISOString().slice(0, 16),
  },
  {
    name: "fecha_expiracion",
    label: "Fecha de expiración",
    type: "datetime-local" as const,
    required: false,
    defaultValue: oneYear.toISOString().slice(0, 16),
  },
];

export default function NoticiasPage() {
  const [feed, setFeed] = useState<ContenidoFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<ContenidoFeed | null>(null);
  const [deletingRow, setDeletingRow] = useState<ContenidoFeed | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const feedResult = await fetchFeed();
      setFeed(feedResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los datos",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      if (active) await load();
    }
    init();
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    if (!syncResult) return;
    const timer = setTimeout(() => setSyncResult(null), 5000);
    return () => clearTimeout(timer);
  }, [syncResult]);

  async function handleSync() {
    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await syncNoticias();
      setSyncResult(result.detail);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  function validateNoticia(data: Record<string, unknown>): string | null {
    const pub = data.fecha_publicacion as string | undefined;
    const exp = data.fecha_expiracion as string | undefined;
    if (pub && exp) {
      if (new Date(exp) <= new Date(pub)) {
        return "La fecha de expiración debe ser posterior a la fecha de publicación";
      }
    }
    return null;
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    const validationError = validateNoticia(formData);
    if (validationError) {
      throw new Error(validationError);
    }
    if (editingRow && editingRow.tipo === "noticia") {
      await updateNoticia(editingRow.id as number, formData);
    } else {
      await createNoticia(formData as Parameters<typeof createNoticia>[0]);
    }
    setShowForm(false);
    setEditingRow(null);
    await load();
  }

  async function handleConfirmDelete() {
    try {
      if (deletingRow && deletingRow.tipo === "noticia") {
        await deleteNoticia(deletingRow.id as number);
        await load();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la noticia",
      );
    }
  }

  const canEdit = !editingRow || editingRow.tipo === "noticia";
  const canDelete = deletingRow?.tipo === "noticia";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Noticias y Eventos</h1>
          <span className="text-sm text-gray-500">
            Feed unificado de noticias y eventos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {syncing ? "Sincronizando..." : "Sincronizar desde UTN"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingRow(null);
              setShowForm(true);
            }}
            className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Crear noticia
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-600">
          {syncResult}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && feed.length > 0 && (
        <div className="mb-6">
          <NoticiasCarousel noticias={feed} />
        </div>
      )}

      <DataTable
        data={feed}
        columns={columns}
        onEdit={(row) => {
          setEditingRow(row as ContenidoFeed);
          setShowForm(true);
        }}
        onDelete={(row) => setDeletingRow(row as ContenidoFeed)}
        isLoading={loading}
        searchPlaceholder="Buscar noticia o evento..."
        label="noticias"
      />

      {showForm && canEdit && (
        <DataFormModal
          title={editingRow ? "Editar noticia" : "Crear noticia"}
          fields={formFields}
          initialData={
            editingRow
              ? {
                  titulo: editingRow.titulo,
                  contenido: editingRow.contenido,
                  imagen_url: editingRow.imagen_url,
                  enlace: editingRow.enlace ?? "",
                  fecha_publicacion: editingRow.fecha?.slice(0, 16) ?? "",
                  fecha_expiracion:
                    editingRow.fecha_expiracion?.slice(0, 16) ?? null,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
          }}
        />
      )}

      {showForm && !canEdit && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Detalle del evento</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-500">
                Los eventos se gestionan desde la sección{" "}
                <strong>Eventos</strong>. No se pueden editar ni eliminar desde
                aquí.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRow(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingRow && canDelete && (
        <ConfirmDeleteModal
          title="Eliminar noticia"
          itemName={String(deletingRow.titulo ?? "")}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingRow(null)}
        />
      )}

      {deletingRow && !canDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <p className="text-sm text-gray-600 mb-4">
              Los eventos no se pueden eliminar desde aquí. Usá la sección{" "}
              <strong>Eventos</strong> del menú.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
