import { useCallback, useEffect, useState } from "react";
import UploadZone from "../components/UploadZone";
import MesaExamenPreviewTable, {
  type MesaExamenPreviewRow,
} from "../components/MesaExamenPreviewTable";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import {
  fetchMesasExamen,
  createMesaExamen,
  updateMesaExamen,
  deleteMesaExamen,
  fetchMateriasForSelect,
  fetchEspaciosForSelect,
  TURNOS,
  type MesaExamen,
} from "../../shared/api/mesasExamen";

type UploadStep = "idle" | "uploading" | "preview" | "done";

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

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [previewRows, setPreviewRows] = useState<MesaExamenPreviewRow[]>([]);
  const [previewMeta, setPreviewMeta] = useState<{
    fileName: string;
    totalMesas: number;
    totalPaginas: number;
  } | null>(null);

  const [materias, setMaterias] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [espacios, setEspacios] = useState<{ value: number; label: string }[]>(
    [],
  );

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<MesaExamen | null>(null);
  const [deletingRow, setDeletingRow] = useState<MesaExamen | null>(null);

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

  function handleUploadFile(_file: File) {
    setUploadStep("uploading");
    setTimeout(() => {
      setPreviewRows([
        {
          materia: "Analisis Matematico I",
          espacio: "",
          fecha: "2026-06-15",
          hora: "08:00",
          turno: "junio",
          llamado: 1,
          tribunal: "",
        },
        {
          materia: "Algebra y Geometria Analitica",
          espacio: "",
          fecha: "2026-06-15",
          hora: "10:00",
          turno: "junio",
          llamado: 1,
          tribunal: "",
        },
      ]);
      setPreviewMeta({
        fileName: _file.name,
        totalMesas: 2,
        totalPaginas: 1,
      });
      setUploadStep("preview");
    }, 1500);
  }

  function handleConfirmImport(_rows: MesaExamenPreviewRow[]) {
    setUploadStep("done");
    setSuccess(
      `Importación simulada: ${_rows.length} mesas procesadas. La implementación real se agregará pronto.`,
    );
    setTimeout(() => {
      setSuccess("");
      setUploadStep("idle");
    }, 4000);
  }

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
      } else {
        await createMesaExamen(formData as Omit<MesaExamen, "id">);
      }
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
      />

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-600">
          {success}
        </div>
      )}

      {uploadStep === "idle" && (
        <div className="mb-6">
          <UploadZone
            onFileSelected={handleUploadFile}
            label="Arrastrá un PDF con las mesas de examen"
          />
        </div>
      )}

      {uploadStep === "uploading" && (
        <div className="mb-6 px-4 py-8 bg-gray-50 border border-gray-200 rounded-2xl text-center">
          <svg
            className="animate-spin h-6 w-6 text-gray-400 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-gray-500">Procesando PDF...</p>
        </div>
      )}

      {uploadStep === "preview" && previewMeta && (
        <div className="mb-6">
          <MesaExamenPreviewTable
            fileName={previewMeta.fileName}
            totalMesas={previewMeta.totalMesas}
            totalPaginas={previewMeta.totalPaginas}
            rows={previewRows}
            onConfirm={handleConfirmImport}
            onCancel={() => {
              setUploadStep("idle");
              setPreviewRows([]);
            }}
          />
        </div>
      )}

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
    </div>
  );
}
