import { useCallback, useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import {
  fetchEventos,
  createEvento,
  updateEvento,
  deleteEvento,
  toggleDestacadoEvento,
  uploadEventoImagen,
  TIPOS_EVENTO,
  type Evento,
} from "../../shared/api/eventos";

const TIPO_LABELS: Record<string, string> = {
  taller: "Taller",
  curso: "Curso",
  recreativo: "Recreativo",
  charla: "Charla",
  otro: "Otro",
};

function formatTipoEvento(raw?: string): string {
  if (!raw) return "Evento";
  const lower = raw.trim().toLowerCase();
  return TIPO_LABELS[lower] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatFechaSimple(inicioStr: string, finStr: string) {
  if (!inicioStr) return { fecha: "-", horario: "" };
  const dInicio = new Date(inicioStr);
  const dFin = finStr ? new Date(finStr) : null;

  const diaInicio = dInicio.getDate();
  const mesInicio = MESES[dInicio.getMonth()];
  const anioInicio = dInicio.getFullYear();
  const horaInicio = formatTime(dInicio);

  if (!dFin) {
    return {
      fecha: `${diaInicio} ${mesInicio} ${anioInicio}`,
      horario: `${horaInicio} hs`,
    };
  }

  const diaFin = dFin.getDate();
  const mesFin = MESES[dFin.getMonth()];
  const anioFin = dFin.getFullYear();
  const horaFin = formatTime(dFin);

  const esMismoDia =
    diaInicio === diaFin &&
    dInicio.getMonth() === dFin.getMonth() &&
    anioInicio === anioFin;

  if (esMismoDia) {
    return {
      fecha: `${diaInicio} ${mesInicio} ${anioInicio}`,
      horario: `${horaInicio} a ${horaFin} hs`,
    };
  }

  if (dInicio.getMonth() === dFin.getMonth() && anioInicio === anioFin) {
    return {
      fecha: `${diaInicio} al ${diaFin} ${mesInicio} ${anioInicio}`,
      horario: `${horaInicio} a ${horaFin} hs`,
    };
  }

  return {
    fecha: `${diaInicio} ${mesInicio} – ${diaFin} ${mesFin} ${anioFin}`,
    horario: `${horaInicio} a ${horaFin} hs`,
  };
}

type EstadoEvento = "en_curso" | "proximo" | "finalizado";

function getEstadoEvento(inicioStr: string, finStr: string): EstadoEvento {
  const now = Date.now();
  const inicio = new Date(inicioStr).getTime();
  const fin = new Date(finStr).getTime();

  if (now > fin) return "finalizado";
  if (now >= inicio && now <= fin) return "en_curso";
  return "proximo";
}

const now = new Date();
const oneHourLater = new Date(now);
oneHourLater.setHours(oneHourLater.getHours() + 1);

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Evento | null>(null);
  const [deletingRow, setDeletingRow] = useState<Evento | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEventos();
      setEventos(data);
    } catch (err) {
      sileo.error({
        title: "Error al cargar eventos",
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

  const handleToggleDestacado = useCallback(async (evento: Evento) => {
    try {
      const updated = await toggleDestacadoEvento(evento.id);
      setEventos((prev) =>
        prev.map((e) =>
          e.id === evento.id
            ? { ...e, destacado: updated.destacado }
            : updated.destacado
              ? { ...e, destacado: false }
              : e,
        ),
      );
      sileo.success({
        title: updated.destacado
          ? "Evento destacado en el tótem"
          : "Evento quitado de destacados",
      });
    } catch (err) {
      sileo.error({
        title: "Error al actualizar destacado",
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }, []);

  const columns = useMemo<Column<Evento>[]>(
    () => [
      {
        key: "titulo",
        label: "Evento",
        sortable: true,
        render: (_val, row) => (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200/80 flex items-center justify-center">
              {row.imagen_url ? (
                <img
                  src={row.imagen_url}
                  alt={row.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-xs">
              <span className="font-semibold text-gray-900 truncate">
                {row.titulo}
              </span>
              {row.descripcion && (
                <span className="text-xs text-gray-500 truncate">
                  {row.descripcion}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "tipo",
        label: "Tipo",
        sortable: true,
        align: "center",
        render: (val) => {
          const label = formatTipoEvento(String(val ?? ""));
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {label}
            </span>
          );
        },
      },
      {
        key: "espacio",
        label: "Lugar",
        align: "center",
        render: (val) => {
          if (!val) return <span className="text-gray-400">-</span>;
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <svg
                className="w-3 h-3 text-gray-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {String(val)}
            </span>
          );
        },
      },
      {
        key: "fecha_hora_inicio",
        label: "Fecha y Horario",
        sortable: true,
        render: (_val, row) => {
          const { fecha, horario } = formatFechaSimple(
            row.fecha_hora_inicio,
            row.fecha_hora_fin,
          );
          return (
            <div className="flex flex-col text-sm py-0.5">
              <span className="font-medium text-gray-900">{fecha}</span>
              <span className="text-xs text-gray-500">{horario}</span>
            </div>
          );
        },
      },
      {
        key: "id",
        label: "Estado",
        align: "center",
        render: (_val, row) => {
          const estado = getEstadoEvento(
            row.fecha_hora_inicio,
            row.fecha_hora_fin,
          );
          if (estado === "en_curso") {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                En curso
              </span>
            );
          }
          if (estado === "proximo") {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                Próximo
              </span>
            );
          }
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              Finalizado
            </span>
          );
        },
      },
      {
        key: "destacado",
        label: "Destacar",
        align: "center",
        render: (_val, row) => {
          const isDestacado = Boolean(row.destacado);
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleDestacado(row);
              }}
              title={
                isDestacado
                  ? "Quitar de destacado en el tótem"
                  : "Destacar en el tótem"
              }
              aria-label={
                isDestacado ? "Quitar de destacado" : "Destacar evento"
              }
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isDestacado
                  ? "text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100"
                  : "text-gray-300 hover:text-amber-400 hover:bg-gray-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${isDestacado ? "fill-amber-400" : "fill-none"} stroke-current`}
                viewBox="0 0 24 24"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        },
      },
    ],
    [handleToggleDestacado],
  );

  function getFormFields(): FormField[] {
    return [
      { name: "titulo", label: "Título", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        defaultValue: "recreativo",
        options: TIPOS_EVENTO.map((t) => ({ value: t.value, label: t.label })),
      },
      {
        name: "espacio",
        label: "Lugar / Espacio",
        type: "text",
        required: false,
        placeholder: "Ej: Aula Magna, Terraza, Aula 2.2, etc.",
      },
      {
        name: "fecha_hora_inicio",
        label: "Fecha y hora inicio",
        type: "datetime-local",
        required: true,
        half: true,
        defaultValue: now.toISOString().slice(0, 16),
      },
      {
        name: "fecha_hora_fin",
        label: "Fecha y hora fin",
        type: "datetime-local",
        required: true,
        half: true,
        defaultValue: oneHourLater.toISOString().slice(0, 16),
      },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
      {
        name: "imagen_url",
        label: "Imagen del evento",
        type: "image",
        required: false,
        onUpload: async (file: File) => {
          const res = await uploadEventoImagen(file);
          return res.url;
        },
      },
    ];
  }

  function validateEvento(data: Record<string, unknown>): string | null {
    const inicio = data.fecha_hora_inicio as string | undefined;
    const fin = data.fecha_hora_fin as string | undefined;
    if (inicio && fin) {
      const dInicio = new Date(inicio);
      const dFin = new Date(fin);
      if (dFin <= dInicio) {
        return "La fecha y hora de fin debe ser posterior a la fecha y hora de inicio";
      }
    }
    return null;
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    const validationError = validateEvento(formData);
    if (validationError) throw new Error(validationError);

    if (editingRow) {
      await updateEvento(editingRow.id, formData);
      sileo.success({ title: "Evento actualizado" });
    } else {
      await createEvento(formData as Parameters<typeof createEvento>[0]);
      sileo.success({ title: "Evento creado" });
    }
    setShowForm(false);
    setEditingRow(null);
    await load();
  }

  async function handleConfirmDelete() {
    try {
      if (!deletingRow) return;
      await deleteEvento(deletingRow.id);
      sileo.success({ title: "Evento eliminado" });
      await load();
    } catch (err) {
      sileo.error({
        title: "Error al eliminar",
        description:
          err instanceof Error ? err.message : "Error al eliminar el evento",
      });
    } finally {
      setDeletingRow(null);
    }
  }

  function handleOpenCreate() {
    setEditingRow(null);
    setShowForm(true);
  }

  function handleOpenEdit(row: Evento) {
    setEditingRow(row);
    setShowForm(true);
  }

  function getInitialData(): Record<string, unknown> | undefined {
    if (!editingRow) return undefined;
    return {
      titulo: editingRow.titulo,
      tipo: editingRow.tipo ?? "recreativo",
      descripcion: editingRow.descripcion ?? "",
      imagen_url: editingRow.imagen_url ?? "",
      fecha_hora_inicio: editingRow.fecha_hora_inicio?.slice(0, 16) ?? "",
      fecha_hora_fin: editingRow.fecha_hora_fin?.slice(0, 16) ?? "",
      espacio: editingRow.espacio ?? "",
    };
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Eventos"
        subtitle="Gestión de eventos, talleres, cursos y actividades institucionales"
        onCreate={handleOpenCreate}
        createLabel="Crear evento"
      />

      <DataTable
        data={eventos}
        columns={columns}
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingRow(row as Evento)}
        isLoading={loading}
        searchPlaceholder="Buscar evento por título..."
        label="eventos"
      />

      {showForm && (
        <DataFormModal
          title={editingRow ? "Editar evento" : "Crear evento"}
          fields={getFormFields()}
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          maxWidth="xl"
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
          }}
        />
      )}

      {deletingRow && (
        <ConfirmDeleteModal
          title="Eliminar evento"
          itemName={String(deletingRow.titulo ?? "")}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingRow(null)}
        />
      )}
    </div>
  );
}
