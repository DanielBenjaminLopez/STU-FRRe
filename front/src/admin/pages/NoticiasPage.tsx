import { useCallback, useEffect, useState } from "react";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import NoticiasCarousel from "../components/NoticiasCarousel";
import {
  fetchNoticias,
  createNoticia,
  updateNoticia,
  deleteNoticia,
  syncNoticias,
  type Noticia,
} from "../../shared/api/noticias";

const columns: Column<Record<string, unknown>>[] = [
  { key: "titulo", label: "Título", sortable: true },
  {
    key: "origen",
    label: "Origen",
    sortable: true,
    render: (val) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === "scraping"
            ? "bg-blue-50 text-blue-600"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {val === "scraping" ? "Scraping" : "Manual"}
      </span>
    ),
  },
  {
    key: "fecha_publicacion",
    label: "Publicación",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleDateString("es-ES");
    },
  },
  {
    key: "fecha_expiracion",
    label: "Expiración",
    render: (val) => {
      if (!val) return "-";
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
  const [data, setData] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Noticia | null>(null);
  const [deletingRow, setDeletingRow] = useState<Noticia | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchNoticias();
      setData(result);
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

  async function handleSubmit(formData: Record<string, unknown>) {
    if (editingRow) {
      await updateNoticia(editingRow.id as number, formData);
    } else {
      await createNoticia(formData as Parameters<typeof createNoticia>[0]);
    }
    await load();
  }

  async function handleConfirmDelete() {
    if (deletingRow) {
      await deleteNoticia(deletingRow.id as number);
      await load();
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Noticias</h1>
          <span className="text-sm text-gray-500">
            Gestión de noticias y publicaciones
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

      {!loading && data.length > 0 && (
        <div className="mb-6">
          <NoticiasCarousel noticias={data} />
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        onEdit={(row) => {
          setEditingRow(row as Noticia);
          setShowForm(true);
        }}
        onDelete={(row) => setDeletingRow(row as Noticia)}
        isLoading={loading}
        searchPlaceholder="Buscar noticia..."
        label="noticias"
      />

      {showForm && (
        <DataFormModal
          title={editingRow ? "Editar noticia" : "Crear noticia"}
          fields={formFields}
          initialData={editingRow ?? undefined}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
          }}
        />
      )}

      {deletingRow && (
        <ConfirmDeleteModal
          title="Eliminar noticia"
          itemName={String(deletingRow.titulo ?? "")}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingRow(null)}
        />
      )}
    </div>
  );
}
