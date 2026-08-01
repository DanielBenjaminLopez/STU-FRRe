import { useCallback, useEffect, useState } from "react";
import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
  fetchMateriasForSelect,
  fetchEspaciosForSelect,
  DIAS_SEMANA,
  type HorarioCursadoConNombres,
} from "../../shared/api/horariosAdmin";
import type { Column } from "../components/DataTable";

const columns: Column<HorarioCursadoConNombres>[] = [
  { key: "materia_nombre", label: "Materia", sortable: true },
  { key: "espacio_nombre", label: "Espacio" },
  { key: "dia_semana", label: "Día", sortable: true },
  { key: "comision", label: "Comisión" },
  { key: "hora_inicio", label: "Inicio" },
  { key: "hora_fin", label: "Fin" },
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

const baseFormFields = [
  {
    name: "dia_semana",
    label: "Día de la semana",
    type: "select" as const,
    required: true,
    options: DIAS_SEMANA.map((d) => ({ value: d.value, label: d.label })),
  },
  {
    name: "comision",
    label: "Comisión",
    type: "text" as const,
    required: true,
  },
  {
    name: "hora_inicio",
    label: "Hora inicio",
    type: "time" as const,
    required: true,
  },
  {
    name: "hora_fin",
    label: "Hora fin",
    type: "time" as const,
    required: true,
  },
  {
    name: "fecha_inicio_vigencia",
    label: "Vigencia desde",
    type: "date" as const,
    required: true,
  },
  {
    name: "fecha_fin_vigencia",
    label: "Vigencia hasta",
    type: "date" as const,
    required: true,
  },
  {
    name: "activo",
    label: "Activo",
    type: "checkbox" as const,
    required: false,
    defaultValue: true,
    placeholder: "Sí",
  },
];

export default function HorariosPage() {
  const [materias, setMaterias] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [espacios, setEspacios] = useState<{ value: number; label: string }[]>(
    [],
  );

  useEffect(() => {
    fetchMateriasForSelect()
      .then((m) =>
        setMaterias(
          m.map((mat) => ({
            value: mat.id,
            label: `${mat.codigo} - ${mat.nombre}`,
          })),
        ),
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
    ...baseFormFields,
  ];

  const fetchList = useCallback(async () => {
    const horarios = await fetchHorarios();
    const hoy = new Date().toISOString().slice(0, 10);
    return horarios.map((h) =>
      h.fecha_fin_vigencia < hoy ? { ...h, activo: false } : h,
    );
  }, []);

  const config = {
    title: "Horarios de cursado",
    subtitle: "Gestión de horarios de materias",
    entityName: "horario",
    columns,
    formFields,
    fetchList,
    create: createHorario,
    update: updateHorario,
    remove: deleteHorario,
    getRowLabel: (row: HorarioCursadoConNombres) =>
      `${row.materia_nombre} - ${row.dia_semana} ${row.hora_inicio}`,
  };

  return <CrudAdminPage config={config} />;
}
