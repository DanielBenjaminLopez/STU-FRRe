import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { sileo } from "sileo";

import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import ImportCsvModal from "../components/ImportCsvModal";
import Button from "../../shared/components/ui/Button";
import { fetchCarreras, type Carrera } from "../../shared/api/carreras";
import { peekApiCache } from "../../shared/api/client";
import { API_ENDPOINTS } from "../../shared/api/endpoints";
import {
  fetchMesasExamen,
  createMesaExamen,
  updateMesaExamen,
  deleteMesaExamen,
  vaciarMesasExamen,
  importarMesasExamenCSV,
  type MesaExamen,
} from "../../features/examenes/api/mesasExamen";

const columns: Column<MesaExamen>[] = [
  {
    key: "carrera_codigo",
    label: "Carrera",
    sortable: true,
    align: "center",
    width: "w-28",
    render: (_, row) => (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800"
        title={row.carrera_nombre}
      >
        {row.carrera_codigo || row.carrera_nombre || "-"}
      </span>
    ),
  },
  {
    key: "materia",
    label: "Materia",
    sortable: true,
    width: "w-[42%]",
    render: (_, row) => (
      <span className="font-medium text-gray-900">
        {row.materia || row.materia_nombre || "-"}
      </span>
    ),
  },
  {
    key: "espacio",
    label: "Espacio",
    sortable: true,
    align: "center",
    width: "w-[24%]",
    render: (val) =>
      val ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          {String(val)}
        </span>
      ) : (
        <span className="text-gray-400 text-xs italic">Sin asignar</span>
      ),
  },
  {
    key: "fecha",
    label: "Fecha y hora",
    sortable: true,
    align: "center",
    width: "w-[24%]",
    render: (_, row) => {
      if (row.fecha) {
        const parts = row.fecha.split("-");
        const fechaStr =
          parts.length === 3
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : row.fecha;
        const horaStr = row.hora ? row.hora.slice(0, 5) : "";
        return (
          <span className="tabular-nums font-medium text-gray-700">
            {horaStr ? `${fechaStr} ${horaStr}` : fechaStr}
          </span>
        );
      }
      return <span className="text-gray-400">-</span>;
    },
  },
];

export default function MesasExamenPage() {
  const cachedMesas = peekApiCache<MesaExamen[]>(API_ENDPOINTS.mesasExamen);
  const cachedCarreras = peekApiCache<Carrera[]>(API_ENDPOINTS.carreras);

  const [data, setData] = useState<MesaExamen[]>(() => cachedMesas ?? []);
  const [loading, setLoading] = useState(() => !cachedMesas);

  const [carreras, setCarreras] = useState<{ value: number; label: string }[]>(
    () =>
      cachedCarreras
        ? cachedCarreras.map((car) => ({ value: car.id, label: car.nombre }))
        : [],
  );

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<MesaExamen | null>(null);
  const [deletingRow, setDeletingRow] = useState<MesaExamen | null>(null);
  const [showVaciarModal, setShowVaciarModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchMesasExamen();
      setData(result);
    } catch (err) {
      sileo.error({
        title: "Error al cargar los datos",
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
        await loadData();
        fetchCarreras()
          .then((c) => {
            if (active)
              setCarreras(
                c.map((car) => ({ value: car.id, label: car.nombre })),
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
      name: "carrera",
      label: "Carrera",
      type: "select",
      required: true,
      options: carreras,
      placeholder: "Seleccionar carrera...",
    },
    {
      name: "materia",
      label: "Materia",
      type: "text",
      required: true,
      placeholder: "Ej: Algoritmos y Estructuras de Datos",
    },
    {
      name: "espacio",
      label: "Espacio",
      type: "text",
      required: false,
      placeholder: "Ej: Aula 10, Aula Magna (opcional)",
    },
    {
      name: "fecha",
      label: "Fecha",
      type: "date",
      required: true,
    },
    {
      name: "hora",
      label: "Hora",
      type: "time",
      required: true,
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
      const fecha = String(formData.fecha || "");

      const payload = {
        carrera: formData.carrera ? Number(formData.carrera) : null,
        materia: String(formData.materia || "").trim(),
        espacio: String(formData.espacio || "").trim(),
        fecha,
        hora: String(formData.hora || "08:00"),
      };

      if (editingRow) {
        await updateMesaExamen(editingRow.id, payload);
      } else {
        await createMesaExamen(payload as unknown as Omit<MesaExamen, "id">);
        sileo.success({ title: "Mesa de examen creada" });
      }
      setShowForm(false);
      setEditingRow(null);
      await loadData();
    } catch (err) {
      sileo.error({
        title: "Error al guardar",
        description:
          err instanceof Error
            ? err.message
            : "Error al guardar la mesa de examen",
      });
    }
  }

  async function handleConfirmDelete() {
    try {
      if (deletingRow) {
        await deleteMesaExamen(deletingRow.id);
        sileo.success({ title: "Mesa de examen eliminada" });
        await loadData();
      }
    } catch (err) {
      sileo.error({
        title: "Error al eliminar",
        description:
          err instanceof Error
            ? err.message
            : "Error al eliminar la mesa de examen",
      });
    } finally {
      setDeletingRow(null);
    }
  }

  async function handleConfirmVaciar() {
    try {
      const res = await vaciarMesasExamen();
      sileo.success({
        title: "Mesas de examen vaciadas",
        description: `Se eliminaron ${res.eliminados} mesas de examen correctamente.`,
      });
      await loadData();
    } catch (err) {
      sileo.error({
        title: "Error al vaciar mesas de examen",
        description:
          err instanceof Error
            ? err.message
            : "No se pudieron eliminar las mesas de examen",
      });
    } finally {
      setShowVaciarModal(false);
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Mesas de examen"
        subtitle="Gestión y carga de mesas de examen"
        onCreate={handleCreate}
        createLabel="Nuevo"
      >
        {data.length > 0 && (
          <Button
            variant="danger"
            onClick={() => setShowVaciarModal(true)}
            className="gap-2"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Vaciar
          </Button>
        )}

        <Button variant="primary" onClick={() => setShowImportModal(true)}>
          Importar
        </Button>
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

      <AnimatePresence>
        {showForm && (
          <DataFormModal
            key="form-modal"
            title={
              editingRow ? "Editar mesa de examen" : "Cargar mesa de examen"
            }
            fields={formFields}
            initialData={
              editingRow
                ? {
                    carrera: editingRow.carrera || "",
                    materia:
                      editingRow.materia || editingRow.materia_nombre || "",
                    espacio: editingRow.espacio || "",
                    fecha: editingRow.fecha || "",
                    hora: editingRow.hora
                      ? editingRow.hora.slice(0, 5)
                      : "08:00",
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

        {deletingRow && (
          <ConfirmDeleteModal
            key="delete-modal"
            title="Eliminar mesa de examen"
            itemName={`${deletingRow.materia || deletingRow.materia_nombre}${deletingRow.fecha ? ` - ${deletingRow.fecha}` : ""}`}
            onConfirm={handleConfirmDelete}
            onClose={() => setDeletingRow(null)}
          />
        )}

        {showVaciarModal && (
          <ConfirmDeleteModal
            key="vaciar-modal"
            title="Vaciar mesas de examen"
            itemName={`todas las mesas de examen cargadas (${data.length} registros)`}
            onConfirm={handleConfirmVaciar}
            onClose={() => setShowVaciarModal(false)}
          />
        )}

        {showImportModal && (
          <ImportCsvModal
            key="import-modal"
            title="Importar mesas de examen"
            onClose={() => setShowImportModal(false)}
            onImport={importarMesasExamenCSV}
            onSuccess={(res) => {
              const exito = res.exito ?? (res.totales?.errores ?? 0) === 0;
              if (exito) {
                sileo.success({
                  title: "Importación exitosa",
                  description:
                    res.detail || "Importación realizada exitosamente.",
                });
              } else {
                sileo.error({
                  title: "La importación falló",
                  description: res.detail || "No se guardó ningún registro.",
                });
              }
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
