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
  createEvento,
  updateEvento,
  deleteEvento,
  fetchEspaciosForSelect,
  TIPOS_EVENTO,
  type ContenidoFeed,
} from "../../shared/api/noticias";
import type { FormField } from "../components/DataFormModal";

const columns: Column<ContenidoFeed>[] = [
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

const oneHourLater = new Date(now);
oneHourLater.setHours(oneHourLater.getHours() + 1);

const noticiaFields: FormField[] = [
  { name: "titulo", label: "Título", type: "text", required: true },
  {
    name: "contenido",
    label: "Contenido",
    type: "textarea",
    required: true,
  },
  {
    name: "imagen_url",
    label: "URL de imagen (opcional)",
    type: "text",
    required: false,
    placeholder: "https://ejemplo.com/imagen.jpg",
  },
  {
    name: "enlace",
    label: "Enlace a noticia original (opcional)",
    type: "text",
    required: false,
    placeholder: "https://frre.utn.edu.ar/noticias/...",
  },
  {
    name: "fecha_publicacion",
    label: "Fecha de publicación",
    type: "datetime-local",
    required: true,
    defaultValue: now.toISOString().slice(0, 16),
  },
  {
    name: "fecha_expiracion",
    label: "Fecha de expiración",
    type: "datetime-local",
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
  const [creatingType, setCreatingType] = useState<"noticia" | "evento" | null>(
    null,
  );
  const [espacios, setEspacios] = useState<{ value: number; label: string }[]>(
    [],
  );

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
      if (active) {
        await load();
        fetchEspaciosForSelect()
          .then((e) => {
            if (active)
              setEspacios(
                e.map((esp) => ({ value: esp.id, label: esp.nombre })),
              );
          })
          .catch(() => {});
      }
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

  function getEventoFields(): FormField[] {
    return [
      { name: "titulo", label: "Título", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: TIPOS_EVENTO.map((t) => ({ value: t.value, label: t.label })),
      },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
      {
        name: "imagen_url",
        label: "URL de imagen (opcional)",
        type: "text",
        required: false,
        placeholder: "https://ejemplo.com/imagen.jpg",
      },
      {
        name: "fecha_hora_inicio",
        label: "Fecha y hora inicio",
        type: "datetime-local",
        required: true,
        defaultValue: now.toISOString().slice(0, 16),
      },
      {
        name: "fecha_hora_fin",
        label: "Fecha y hora fin",
        type: "datetime-local",
        required: true,
        defaultValue: oneHourLater.toISOString().slice(0, 16),
      },
      {
        name: "espacio",
        label: "Espacio",
        type: "select",
        required: false,
        options: espacios,
      },
    ];
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

  function validateEvento(data: Record<string, unknown>): string | null {
    const inicio = data.fecha_hora_inicio as string | undefined;
    const fin = data.fecha_hora_fin as string | undefined;
    if (inicio && fin) {
      const dInicio = new Date(inicio);
      const dFin = new Date(fin);
      if (dFin <= dInicio) {
        return "La fecha de fin debe ser posterior a la fecha de inicio";
      }
      const diffMs = dFin.getTime() - dInicio.getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      if (diffDias < 1) {
        return "El evento debe tener una duración mínima de 1 día";
      }
    }
    return null;
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    const isEditingEvento = editingRow?.tipo === "evento";
    const isCreatingEvento = creatingType === "evento";

    if (isEditingEvento || isCreatingEvento) {
      const validationError = validateEvento(formData);
      if (validationError) throw new Error(validationError);
    } else {
      const validationError = validateNoticia(formData);
      if (validationError) throw new Error(validationError);
    }

    if (isEditingEvento && editingRow) {
      await updateEvento(editingRow.id as number, formData);
    } else if (isCreatingEvento) {
      await createEvento(formData as Parameters<typeof createEvento>[0]);
    } else if (editingRow) {
      await updateNoticia(editingRow.id as number, formData);
    } else {
      await createNoticia(formData as Parameters<typeof createNoticia>[0]);
    }
    setShowForm(false);
    setEditingRow(null);
    setCreatingType(null);
    await load();
  }

  async function handleConfirmDelete() {
    try {
      if (!deletingRow) return;
      if (deletingRow.tipo === "evento") {
        await deleteEvento(deletingRow.id as number);
      } else {
        await deleteNoticia(deletingRow.id as number);
      }
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Error al eliminar ${deletingRow?.tipo === "evento" ? "el evento" : "la noticia"}`,
      );
    } finally {
      setDeletingRow(null);
    }
  }

  function handleOpenCreate(type: "noticia" | "evento") {
    setEditingRow(null);
    setCreatingType(type);
    setShowForm(true);
  }

  function handleOpenEdit(row: ContenidoFeed) {
    setCreatingType(null);
    setEditingRow(row);
    setShowForm(true);
  }

  function getInitialData(): Record<string, unknown> | undefined {
    if (!editingRow) return undefined;
    if (editingRow.tipo === "evento") {
      return {
        titulo: editingRow.titulo,
        tipo: editingRow.tipo_evento ?? "",
        descripcion: editingRow.contenido ?? "",
        imagen_url: editingRow.imagen_url ?? "",
        fecha_hora_inicio: editingRow.fecha?.slice(0, 16) ?? "",
        fecha_hora_fin: "",
        espacio: "",
      };
    }
    return {
      titulo: editingRow.titulo,
      contenido: editingRow.contenido,
      imagen_url: editingRow.imagen_url,
      enlace: editingRow.enlace ?? "",
      fecha_publicacion: editingRow.fecha?.slice(0, 16) ?? "",
      fecha_expiracion: editingRow.fecha_expiracion?.slice(0, 16) ?? null,
    };
  }

  function getFormTitle(): string {
    if (creatingType === "evento") return "Crear evento";
    if (creatingType === "noticia") return "Crear noticia";
    if (editingRow?.tipo === "evento") return "Editar evento";
    return "Editar noticia";
  }

  const isEventoForm =
    creatingType === "evento" || editingRow?.tipo === "evento";
  const currentFields = isEventoForm ? getEventoFields() : noticiaFields;

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
            onClick={() => handleOpenCreate("noticia")}
            className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Cargar noticia
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate("evento")}
            className="px-5 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-2xl hover:bg-green-100 transition-colors"
          >
            Cargar evento
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
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingRow(row as ContenidoFeed)}
        isLoading={loading}
        searchPlaceholder="Buscar noticia o evento..."
        label="noticias"
      />

      {showForm && (
        <DataFormModal
          title={getFormTitle()}
          fields={currentFields}
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
            setCreatingType(null);
          }}
        />
      )}

      {deletingRow && (
        <ConfirmDeleteModal
          title={
            deletingRow.tipo === "evento"
              ? "Eliminar evento"
              : "Eliminar noticia"
          }
          itemName={String(deletingRow.titulo ?? "")}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingRow(null)}
        />
      )}
    </div>
  );
}
