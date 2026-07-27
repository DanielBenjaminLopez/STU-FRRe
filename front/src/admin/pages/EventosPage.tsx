import { useEffect, useState } from "react";
import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchEventos,
  createEvento,
  updateEvento,
  deleteEvento,
  fetchEspaciosForSelect,
  TIPOS_EVENTO,
} from "../../shared/api/eventos";
import type { Column } from "../components/DataTable";

const columns: Column<Record<string, unknown>>[] = [
  { key: "titulo", label: "Título", sortable: true },
  { key: "tipo", label: "Tipo", sortable: true },
  {
    key: "descripcion",
    label: "Descripción",
    render: (val) => {
      const text = String(val ?? "");
      return text.length > 50 ? text.slice(0, 50) + "..." : text || "-";
    },
  },
  { key: "espacio_nombre", label: "Espacio" },
  {
    key: "fecha_hora_inicio",
    label: "Inicio",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    },
  },
  {
    key: "fecha_hora_fin",
    label: "Fin",
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    },
  },
];

export default function EventosPage() {
  const [espacios, setEspacios] = useState<{ value: number; label: string }[]>(
    [],
  );

  useEffect(() => {
    fetchEspaciosForSelect()
      .then((e) =>
        setEspacios(e.map((esp) => ({ value: esp.id, label: esp.nombre }))),
      )
      .catch(() => {});
  }, []);

  const formFields = [
    { name: "titulo", label: "Título", type: "text" as const, required: true },
    {
      name: "tipo",
      label: "Tipo",
      type: "select" as const,
      required: true,
      options: TIPOS_EVENTO.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "textarea" as const,
      required: false,
    },
    {
      name: "fecha_hora_inicio",
      label: "Fecha y hora inicio",
      type: "datetime-local" as const,
      required: true,
    },
    {
      name: "fecha_hora_fin",
      label: "Fecha y hora fin",
      type: "datetime-local" as const,
      required: true,
    },
    {
      name: "espacio",
      label: "Espacio",
      type: "select" as const,
      required: false,
      options: espacios,
    },
  ];

  const config = {
    title: "Eventos",
    subtitle: "Gestión de actividades extra y eventos",
    entityName: "evento",
    columns,
    formFields,
    fetchList: fetchEventos,
    create: createEvento,
    update: updateEvento,
    remove: deleteEvento,
    getRowLabel: (row: Record<string, unknown>) => String(row.titulo ?? ""),
  };

  return <CrudAdminPage config={config} />;
}
