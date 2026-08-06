import { useCallback, useEffect, useState } from "react";

import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import ImportCsvModal from "../components/ImportCsvModal";
import {
  fetchMesasExamen,
  createMesaExamen,
  updateMesaExamen,
  deleteMesaExamen,
  fetchMateriasForSelect,
  fetchEspaciosForSelect,
  importarMesasExamenCSV,
  TURNOS,
  type MesaExamen,
} from "../../shared/api/mesasExamen";

const columns: Column<MesaExamen>[] = [
  { key: "materia_nombre", label: "Materia", sortable: true },
  { key: "espacio_nombre", label: "Espacio" },
  {
    key: "fecha_hora",
    label: "Fecha y hora",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
  },
  { key: "turno", label: "Turno", sortable: true },
  { key: "llamado", label: "Llamado" },
  {
    key: "activo",
    label: "Estado",
    render: (val) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}
      >
        {val ? "Activo" : "Inactivo"}
      </span>
    ),
  },
];

export default function MesasExamenPage() {
  const [data, setData] = useState<MesaExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  void error;
  void success;

  const [materias, setMaterias] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [espacios, setEspacios] = useState<{ value: number; label: string }[]>(
    [],
  );

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<MesaExamen | null>(null);
  const [deletingRow, setDeletingRow] = useState<MesaExamen | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchMesasExamen();
      const now = Date.now();
      setData(
        result.map((mesa) => ({
          ...mesa,
          activo: new Date(mesa.fecha_hora).getTime() > now && mesa.activo,
        })),
      );
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
        await loadData();
        fetchMateriasForSelect()
          .then((m) => {
            if (active)
              setMaterias(
                m.map((mat) => ({ value: mat.id, label: mat.nombre })),
              );
          })
          .catch(() => {});
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
  }, [loadData]);

  const formFields: FormField[] = [
    {
      name: "materia",
      label: "Materia",
      type: "select",
      required: true,
      options: materias,
    },
    {
      name: "espacio",
      label: "Espacio",
      type: "select",
      required: true,
      options: espacios,
    },
    {
      name: "fecha_hora",
      label: "Fecha y hora",
      type: "datetime-local",
      required: true,
    },
    {
      name: "turno",
      label: "Turno",
      type: "select",
      required: true,
      options: TURNOS.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      name: "llamado",
      label: "Llamado",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "tribunal",
      label: "Tribunal",
      type: "textarea",
      required: false,
    },
  ];

  function handleCreate() {
    setEditingRow(null);
    setShowForm(true);
  }

  function handleEdit(row: MesaExamen) {
    setEditingRow(row);
    setShowForm(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    try {
      if (editingRow) {
        await updateMesaExamen(editingRow.id, formData);
        setSuccess("Mesa de examen actualizada");
      } else {
        await createMesaExamen(formData as Omit<MesaExamen, "id">);
        setSuccess("Mesa de examen creada");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowForm(false);
      setEditingRow(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function handleConfirmDelete() {
    try {
      if (deletingRow) {
        await deleteMesaExamen(deletingRow.id);
        setSuccess("Mesa de examen eliminada");
        setTimeout(() => setSuccess(""), 3000);
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingRow(null);
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Mesas de examen"
        subtitle="Gestión y carga de mesas de examen"
        onCreate={handleCreate}
        createLabel="Cargar mesa de examen"
      >
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
        >
          Importar
        </button>
      </PageHeader>

      <DataTable
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(row) => setDeletingRow(row)}
        isLoading={loading}
        searchPlaceholder="Buscar mesa de examen..."
        label="mesas de examen"
      />

      {showForm && (
        <DataFormModal
          title={editingRow ? "Editar mesa de examen" : "Cargar mesa de examen"}
          fields={formFields}
          initialData={
            (editingRow as unknown as Record<string, unknown>) ?? undefined
          }
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
          }}
        />
      )}

      {deletingRow && (
        <ConfirmDeleteModal
          title="Eliminar mesa de examen"
          itemName={`${deletingRow.materia_nombre} - ${deletingRow.turno} Llamado ${deletingRow.llamado}`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingRow(null)}
        />
      )}

      {showImportModal && (
        <ImportCsvModal
          title="Importar mesas de examen"
          onClose={() => setShowImportModal(false)}
          onImport={importarMesasExamenCSV}
          onSuccess={(res) => {
            setSuccess(res.detail || "Importación realizada exitosamente.");
            loadData();
            setTimeout(() => setSuccess(""), 4000);
          }}
        />
      )}
    </div>
  );
}
