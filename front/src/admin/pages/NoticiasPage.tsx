import { useCallback, useEffect, useState, useMemo } from "react";
import { sileo } from "sileo";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import NoticiasCarousel from "../components/NoticiasCarousel";
import Button from "../../shared/components/ui/Button";
import {
  fetchNoticias,
  createNoticia,
  updateNoticia,
  deleteNoticia,
  syncNoticias,
  type Noticia,
  type ContenidoFeed,
} from "../../features/noticias/api/noticias";

const columns: Column<Noticia>[] = [
  { key: "titulo", label: "Título", sortable: true },
  {
    key: "origen",
    label: "Origen",
    sortable: true,
    align: "center",
    render: (val) => {
      const isScraping = val === "scraping";
      return (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isScraping
              ? "bg-blue-50 text-blue-700"
              : "bg-purple-50 text-purple-700"
          }`}
        >
          {isScraping ? "Scraping" : "Manual"}
        </span>
      );
    },
  },
  {
    key: "fecha_publicacion",
    label: "Fecha de publicación",
    sortable: true,
    align: "center",
    render: (val) => {
      if (!val) return "-";
      const d = new Date(String(val));
      return d.toLocaleDateString("es-ES");
    },
  },
  {
    key: "fecha_expiracion",
    label: "Fecha de expiración",
    sortable: true,
    align: "center",
    render: (val) => {
      if (!val) return "-";
      const d = new Date(String(val));
      return d.toLocaleDateString("es-ES");
    },
  },
  {
    key: "imagen_url",
    label: "Imagen",
    align: "center",
    render: (val) => {
      if (!val) return "-";
      return (
        <img
          src={String(val)}
          alt="Miniatura"
          className="w-10 h-10 rounded-lg object-cover mx-auto"
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
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Noticia | null>(null);
  const [deletingRow, setDeletingRow] = useState<Noticia | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNoticias();
      setNoticias(data);
    } catch (err) {
      sileo.error({
        title: "Error al cargar noticias",
        description:
          err instanceof Error ? err.message : "Error al cargar los datos",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      if (active) {
        await load();
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [load]);

  async function handleSync() {
    try {
      setSyncing(true);
      const result = await syncNoticias();
      sileo.success({
        title: "Sincronización finalizada",
        description: result.detail,
      });
      await load();
    } catch (err) {
      sileo.error({
        title: "Error al sincronizar",
        description:
          err instanceof Error ? err.message : "Error al sincronizar noticias",
      });
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
    if (validationError) throw new Error(validationError);

    if (editingRow) {
      await updateNoticia(editingRow.id, formData);
      sileo.success({ title: "Noticia actualizada" });
    } else {
      await createNoticia(formData as Parameters<typeof createNoticia>[0]);
      sileo.success({ title: "Noticia creada" });
    }
    setShowForm(false);
    setEditingRow(null);
    await load();
  }

  async function handleConfirmDelete() {
    try {
      if (!deletingRow) return;
      await deleteNoticia(deletingRow.id);
      sileo.success({ title: "Noticia eliminada" });
      await load();
    } catch (err) {
      sileo.error({
        title: "Error al eliminar",
        description:
          err instanceof Error ? err.message : "Error al eliminar la noticia",
      });
    } finally {
      setDeletingRow(null);
    }
  }

  function handleOpenCreate() {
    setEditingRow(null);
    setShowForm(true);
  }

  function handleOpenEdit(row: Noticia) {
    setEditingRow(row);
    setShowForm(true);
  }

  function getInitialData(): Record<string, unknown> | undefined {
    if (!editingRow) return undefined;
    return {
      titulo: editingRow.titulo,
      contenido: editingRow.contenido,
      imagen_url: editingRow.imagen_url,
      enlace: editingRow.enlace ?? "",
      fecha_publicacion: editingRow.fecha_publicacion?.slice(0, 16) ?? "",
      fecha_expiracion: editingRow.fecha_expiracion?.slice(0, 16) ?? null,
    };
  }

  const feedForCarousel = useMemo<ContenidoFeed[]>(() => {
    return noticias.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      contenido: n.contenido,
      fecha: n.fecha_publicacion,
      fecha_expiracion: n.fecha_expiracion,
      imagen_url: n.imagen_url,
      tipo: "noticia",
      origen: n.origen,
      enlace: n.enlace,
    }));
  }, [noticias]);

  return (
    <div className="p-8">
      <PageHeader
        title="Noticias"
        subtitle="Gestión de noticias institucionales y sincronización con UTN"
        onCreate={handleOpenCreate}
        createLabel="Cargar noticia"
      >
        <Button variant="secondary" onClick={handleSync} disabled={syncing}>
          {syncing ? "Sincronizando..." : "Sincronizar desde UTN"}
        </Button>
      </PageHeader>

      {!loading && feedForCarousel.length > 0 && (
        <div className="mb-6">
          <NoticiasCarousel noticias={feedForCarousel} />
        </div>
      )}

      <DataTable
        data={noticias}
        columns={columns}
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingRow(row as Noticia)}
        isLoading={loading}
        searchPlaceholder="Buscar noticia..."
        label="noticias"
      />

      {showForm && (
        <DataFormModal
          title={editingRow ? "Editar noticia" : "Crear noticia"}
          fields={noticiaFields}
          initialData={getInitialData()}
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
