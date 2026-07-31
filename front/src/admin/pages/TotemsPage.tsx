import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import {
  deleteTotem,
  fetchEspacios,
  fetchTotems,
  updateTotem,
  vincularTotem,
  type Espacio,
  type Totem,
} from "../../shared/api/totems";
import {
  fetchPlantillas,
  type PlantillaDTO,
} from "../../shared/api/plantillas";
import { useTotem } from "../../shared/context/TotemContext";

function Badge({ active, children }: { active: boolean; children: string }) {
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {children}
    </span>
  );
}

const columns: Column<Totem>[] = [
  {
    key: "nombre",
    label: "Nombre",
    sortable: true,
    render: (value, row) => (
      <span className="font-medium text-gray-900">
        {String(value ?? "") || `Tótem #${row.id}`}
      </span>
    ),
  },
  {
    key: "espacio_nombre",
    label: "Espacio",
    sortable: true,
    render: (value) =>
      value ? String(value) : <span className="text-gray-400">—</span>,
  },
  {
    key: "vinculado",
    label: "Estado",
    sortable: true,
    render: (value) => (
      <Badge active={Boolean(value)}>
        {value ? "Vinculado" : "Sin vincular"}
      </Badge>
    ),
  },
  {
    key: "activo",
    label: "Activo",
    sortable: true,
    render: (value) => (
      <Badge active={Boolean(value)}>{value ? "Activo" : "Inactivo"}</Badge>
    ),
  },
  {
    key: "plantilla",
    label: "Plantilla",
    render: (value) => {
      const plantilla = value as PlantillaDTO | null;
      return (
        plantilla?.nombre || (
          <span className="text-gray-400">Sin plantilla</span>
        )
      );
    },
  },
];

export default function TotemsPage() {
  const { refreshTotems } = useTotem();

  const [totems, setTotems] = useState<Totem[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showVincular, setShowVincular] = useState(false);
  const [editing, setEditing] = useState<Totem | null>(null);
  const [deleting, setDeleting] = useState<Totem | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setTotems(await fetchTotems());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los tótems",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      await Promise.all([
        fetchEspacios().catch(() => []),
        fetchPlantillas().catch(() => []),
      ]).then(([espaciosResult, plantillasResult]) => {
        if (!active) return;
        setEspacios(espaciosResult as Espacio[]);
        setPlantillas(plantillasResult as PlantillaDTO[]);
      });
      if (active) await load();
    }
    init();
    return () => {
      active = false;
    };
  }, [load]);

  const espacioOptions = espacios.map((e) => ({
    value: e.id,
    label: `${e.nombre} - Piso ${e.piso} (${e.tipo})`,
  }));

  const plantillaOptions = plantillas.map((p) => ({
    value: p.id,
    label: p.nombre,
  }));

  const vincularFields: FormField[] = [
    {
      name: "codigo_vinculacion",
      label: "Código de vinculación",
      type: "text",
      required: true,
      placeholder: "Ej: 34735",
    },
    {
      name: "nombre",
      label: "Nombre del tótem",
      type: "text",
      required: true,
    },
    {
      name: "espacio_id",
      label: "Espacio",
      type: "select",
      required: true,
      options: espacioOptions,
    },
  ];

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

  async function handleVincular(data: Record<string, unknown>) {
    try {
      setError("");
      await vincularTotem({
        codigo_vinculacion: String(data.codigo_vinculacion ?? ""),
        nombre: String(data.nombre ?? ""),
        espacio_id: Number(data.espacio_id),
      });
      setShowVincular(false);
      await load();
      await refreshTotems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al vincular tótem");
    }
  }

  function handleEdit(totem: Totem) {
    if (!totem.vinculado) {
      setError(
        "Este tótem aún no está vinculado. Usá 'Vincular tótem' para completar su configuración.",
      );
      return;
    }
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
      await load();
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
      await load();
      await refreshTotems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el tótem",
      );
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Tótems"
        subtitle="Gestioná los tótems, su estado y la plantilla asignada"
        onCreate={() => {
          setError("");
          setShowVincular(true);
        }}
        createLabel="Vincular tótem"
      />

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}

      <DataTable
        data={totems}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(totem) => {
          setError("");
          setDeleting(totem);
        }}
        isLoading={loading}
        searchPlaceholder="Buscar tótem..."
        label="tótems"
      />

      {showVincular && (
        <DataFormModal
          title="Vincular tótem"
          fields={vincularFields}
          onSubmit={handleVincular}
          onClose={() => {
            setShowVincular(false);
            setError("");
          }}
        />
      )}

      {editing && (
        <DataFormModal
          title={`Editar tótem`}
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
