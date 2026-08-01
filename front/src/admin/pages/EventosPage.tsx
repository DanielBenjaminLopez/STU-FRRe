import { useEffect, useState } from "react";
import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchEventos,
  createEvento,
  updateEvento,
  deleteEvento,
  fetchEspaciosForSelect,
  TIPOS_EVENTO,
  type Evento,
} from "../../shared/api/eventos";
import type { Column } from "../components/DataTable";

const columns: Column<Evento>[] = [
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
  {
    key: "fecha_hora_inicio",
    label: "Inicio",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
  },
  {
    key: "fecha_hora_fin",
    label: "Fin",
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
  },
];

const now = new Date();
const oneHourLater = new Date(now);
oneHourLater.setHours(oneHourLater.getHours() + 1);

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
      name: "imagen_url",
      label: "URL de imagen (opcional)",
      type: "text" as const,
      required: false,
      placeholder: "https://ejemplo.com/imagen.jpg",
    },
    {
      name: "fecha_hora_inicio",
      label: "Fecha y hora inicio",
      type: "datetime-local" as const,
      required: true,
      defaultValue: now.toISOString().slice(0, 16),
    },
    {
      name: "fecha_hora_fin",
      label: "Fecha y hora fin",
      type: "datetime-local" as const,
      required: true,
      defaultValue: oneHourLater.toISOString().slice(0, 16),
    },
    {
      name: "espacio",
      label: "Espacio",
      type: "select" as const,
      required: false,
      options: espacios,
    },
  ];

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
    getRowLabel: (row: Evento) => String(row.titulo ?? ""),
    validate: validateEvento,
  };

  return <CrudAdminPage config={config} />;
}
