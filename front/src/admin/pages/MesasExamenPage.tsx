import { useEffect, useState } from "react";
import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchMesasExamen,
  createMesaExamen,
  updateMesaExamen,
  deleteMesaExamen,
  fetchMateriasForSelect,
  fetchEspaciosForSelect,
  TURNOS,
} from "../../shared/api/mesasExamen";
import type { Column } from "../components/DataTable";

const columns: Column<Record<string, unknown>>[] = [
  { key: "materia_nombre", label: "Materia", sortable: true },
  { key: "espacio_nombre", label: "Espacio" },
  {
    key: "fecha_hora",
    label: "Fecha y hora",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    },
  },
  { key: "turno", label: "Turno", sortable: true },
  { key: "llamado", label: "Llamado" },
  {
    key: "activo",
    label: "Activo",
    render: (val) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}
      >
        {val ? "Sí" : "No"}
      </span>
    ),
  },
];

export default function MesasExamenPage() {
  const [materias, setMaterias] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [espacios, setEspacios] = useState<{ value: number; label: string }[]>(
    [],
  );

  useEffect(() => {
    fetchMateriasForSelect()
      .then((m) =>
        setMaterias(m.map((mat) => ({ value: mat.id, label: `${mat.codigo} - ${mat.nombre}` }))),
      )
      .catch(() => {});
    fetchEspaciosForSelect()
      .then((e) =>
        setEspacios(e.map((esp) => ({ value: esp.id, label: esp.nombre }))),
      )
      .catch(() => {});
  }, []);

  const formFields = [
    {
      name: "materia",
      label: "Materia",
      type: "select" as const,
      required: true,
      options: materias,
    },
    {
      name: "espacio",
      label: "Espacio",
      type: "select" as const,
      required: true,
      options: espacios,
    },
    {
      name: "fecha_hora",
      label: "Fecha y hora",
      type: "datetime-local" as const,
      required: true,
    },
    {
      name: "turno",
      label: "Turno",
      type: "select" as const,
      required: true,
      options: TURNOS.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      name: "llamado",
      label: "Llamado",
      type: "number" as const,
      required: true,
    },
    {
      name: "tribunal",
      label: "Tribunal",
      type: "textarea" as const,
      required: false,
    },
    {
      name: "activo",
      label: "Activo",
      type: "checkbox" as const,
      required: false,
      placeholder: "Sí",
    },
  ];

  const config = {
    title: "Mesas de examen",
    subtitle: "Gestión de mesas de examen",
    entityName: "mesa de examen",
    columns,
    formFields,
    fetchList: fetchMesasExamen,
    create: createMesaExamen,
    update: updateMesaExamen,
    remove: deleteMesaExamen,
    getRowLabel: (row: Record<string, unknown>) =>
      `${row.materia_nombre} - ${row.turno} Llamado ${row.llamado}`,
  };

  return <CrudAdminPage config={config} />;
}
