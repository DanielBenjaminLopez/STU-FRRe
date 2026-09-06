import { useCallback, useEffect, useState } from "react";

import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import ImportCsvModal from "../components/ImportCsvModal";
import Button from "../../shared/components/ui/Button";
import { fetchCarreras } from "../../shared/api/carreras";
import {
  fetchMesasExamen,
  createMesaExamen,
  updateMesaExamen,
  deleteMesaExamen,
  fetchPlanMaterias,
  fetchEspaciosForSelect,
  importarMesasExamenCSV,
  getTurnoFromFecha,
  type MesaExamen,
  type PlanMateriaDTO,
} from "../../shared/api/mesasExamen";

const columns: Column<MesaExamen>[] = [
  { key: "materia_nombre", label: "Materia", sortable: true },
  { key: "espacio_nombre", label: "Espacio" },
  {
    key: "fecha_hora",
    label: "Fecha y hora",
    sortable: true,
    render: (_, row) => {
      if (row.fecha_hora) {
        const d = new Date(row.fecha_hora);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
          });
        }
      }
      if (row.fecha) {
        const parts = row.fecha.split("-");
        const fechaStr =
          parts.length === 3
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : row.fecha;
        const horaStr = row.hora ? row.hora.slice(0, 5) : "";
        return horaStr ? `${fechaStr} ${horaStr}` : fechaStr;
      }
      return "-";
    },
  },
  {
    key: "turno",
    label: "Turno",
    sortable: true,
    render: (val) => {
      const str = String(val || "");
      return str
        ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
        : "-";
    },
  },
  {
    key: "llamado",
    label: "Llamado",
    render: (val, row) => {
      const LLAMADO_MAP: Record<string, number> = {
        febrero: 1,
        marzo: 2,
        abril: 3,
        junio: 4,
        agosto: 5,
        septiembre: 6,
        octubre: 7,
        diciembre: 8,
      };
      const num =
        val !== undefined && val !== null && val !== ""
          ? Number(val)
          : LLAMADO_MAP[String(row.turno).toLowerCase()];
      return num ? `${num}º llamado` : "-";
    },
  },
];

export default function MesasExamenPage() {
  const [data, setData] = useState<MesaExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  void error;
  void success;

  const [carreras, setCarreras] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [planMaterias, setPlanMaterias] = useState<PlanMateriaDTO[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<number | null>(null);
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
        result.map((mesa) => {
          const fh =
            mesa.fecha_hora ||
            (mesa.fecha ? `${mesa.fecha}T${mesa.hora || "00:00"}` : "");
          const fTime = fh ? new Date(fh).getTime() : 0;
          return {
            ...mesa,
            activo: fTime > now && mesa.activo,
          };
        }),
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
        fetchCarreras()
          .then((c) => {
            if (active)
              setCarreras(
                c.map((car) => ({ value: car.id, label: car.nombre })),
              );
          })
          .catch(() => {});
        fetchPlanMaterias()
          .then((pmList) => {
            if (active) setPlanMaterias(pmList);
          })
          .catch(() => {});
        fetchEspaciosForSelect()
          .then((e) => {
            if (active) {
              const filtrados = e.filter((esp) => {
                const t = String(esp.tipo).toLowerCase();
                return (
                  t === "aula" ||
                  t === "laboratorio_informatico" ||
                  t === "laboratorio informático" ||
                  t.includes("aula") ||
                  t.includes("laboratorio")
                );
              });
              filtrados.sort((a, b) => {
                const tipoA = String(a.tipo).toLowerCase().startsWith("aula")
                  ? 0
                  : 1;
                const tipoB = String(b.tipo).toLowerCase().startsWith("aula")
                  ? 0
                  : 1;
                if (tipoA !== tipoB) return tipoA - tipoB;
                return String(a.nombre).localeCompare(String(b.nombre), "es");
              });
              setEspacios(
                filtrados.map((esp) => ({ value: esp.id, label: esp.nombre })),
              );
            }
          })
          .catch(() => {});
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [loadData]);

  const materiasFilteredOptions = (
    selectedCarrera
      ? planMaterias.filter(
          (pm) => Number(pm.carrera) === Number(selectedCarrera),
        )
      : planMaterias
  ).map((pm) => ({
    value: pm.id,
    label: selectedCarrera
      ? pm.materia_nombre || `Materia #${pm.id}`
      : pm.carrera_nombre
        ? `${pm.materia_nombre} (${pm.carrera_nombre})`
        : pm.materia_nombre || `Materia #${pm.id}`,
  }));

  const formFields: FormField[] = [
    {
      name: "carrera",
      label: "Carrera",
      type: "select",
      required: false,
      options: carreras,
      placeholder: "Todas las carreras",
    },
    {
      name: "plan_materia",
      label: "Materia",
      type: "select",
      required: true,
      options: materiasFilteredOptions,
      placeholder: "Seleccionar materia...",
    },
    {
      name: "espacio",
      label: "Espacio",
      type: "select",
      required: true,
      options: espacios,
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
    setSelectedCarrera(null);
    setEditingRow(null);
    setShowForm(true);
  }

  function handleEdit(row: MesaExamen) {
    const pmId = row.plan_materia || row.materia;
    const pm = planMaterias.find((p) => p.id === pmId);
    setSelectedCarrera(pm?.carrera ? Number(pm.carrera) : null);
    setEditingRow(row);
    setShowForm(true);
  }

  function handleFormChange(
    name: string,
    value: unknown,
    setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
  ) {
    if (name === "carrera") {
      const cId = value ? Number(value) : null;
      setSelectedCarrera(cId);
      setFormData((prev) => ({ ...prev, plan_materia: "" }));
    }
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    try {
      const fecha = String(formData.fecha || "");
      const autoTurno =
        getTurnoFromFecha(fecha) || editingRow?.turno || "febrero";

      const payload = {
        plan_materia: Number(formData.plan_materia || formData.materia),
        espacio: Number(formData.espacio),
        fecha,
        hora: String(formData.hora || "08:00"),
        turno: autoTurno,
      };

      if (editingRow) {
        await updateMesaExamen(editingRow.id, payload);
        setSuccess("Mesa de examen actualizada");
      } else {
        await createMesaExamen(payload as unknown as Omit<MesaExamen, "id">);
        setSuccess("Mesa de examen creada");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowForm(false);
      setEditingRow(null);
      setSelectedCarrera(null);
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
        createLabel="Nuevo"
      >
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

      {showForm && (
        <DataFormModal
          title={editingRow ? "Editar mesa de examen" : "Cargar mesa de examen"}
          fields={formFields}
          initialData={
            editingRow
              ? {
                  carrera:
                    planMaterias.find(
                      (p) =>
                        p.id ===
                        (editingRow.plan_materia || editingRow.materia),
                    )?.carrera || "",
                  plan_materia: editingRow.plan_materia || editingRow.materia,
                  espacio: editingRow.espacio,
                  fecha:
                    editingRow.fecha ||
                    (editingRow.fecha_hora
                      ? editingRow.fecha_hora.split("T")[0]
                      : ""),
                  hora:
                    editingRow.hora ||
                    (editingRow.fecha_hora
                      ? editingRow.fecha_hora.split("T")[1]?.slice(0, 5)
                      : "08:00"),
                }
              : undefined
          }
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
            setSelectedCarrera(null);
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
