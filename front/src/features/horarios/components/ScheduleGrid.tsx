import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ScheduleGridSkeleton } from "../../../shared/components/ui/Skeleton";
import {
  overlayContainerVariants,
  overlayPanelVariants,
} from "../../widgets/overlayMotion";
import { formatAula } from "../../../shared/utils/formatAula";

export interface ScheduleItem {
  id: number;
  carrera_codigo: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
  fecha?: string;
}

export interface ScheduleGridProps {
  title: string;
  items: ScheduleItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  headerGradient?: string;
  colorVariant?: "blue" | "green" | "gray";
}

const CARRERA_COLORS: Record<
  string,
  { bg: string; border: string; text: string; badge: string; accent: string }
> = {
  ISI: {
    bg: "bg-cyan-50/90",
    border: "border-cyan-200",
    text: "text-cyan-950",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    accent: "bg-cyan-500",
  },
  IEM: {
    bg: "bg-amber-50/90",
    border: "border-amber-200",
    text: "text-amber-950",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    accent: "bg-amber-500",
  },
  IQ: {
    bg: "bg-emerald-50/90",
    border: "border-emerald-200",
    text: "text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accent: "bg-emerald-500",
  },
  LAR: {
    bg: "bg-yellow-50/90",
    border: "border-yellow-200",
    text: "text-yellow-950",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accent: "bg-yellow-500",
  },
  TUP: {
    bg: "bg-purple-50/90",
    border: "border-purple-200",
    text: "text-purple-950",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    accent: "bg-purple-500",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-gray-50/90",
  border: "border-gray-200",
  text: "text-gray-900",
  badge: "bg-gray-100 text-gray-700 border-gray-200",
  accent: "bg-gray-400",
};

const DAY_NAMES = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];
const DAY_FULL_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const DAY_INDEX: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
  domingo: 6,
};

function getMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatFechaGroupHeader(
  fecha?: string,
  diaSemana?: string,
): {
  title: string;
  relativeBadge: string | null;
} {
  if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      const formatted = dateObj.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const title = formatted.charAt(0).toUpperCase() + formatted.slice(1);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round(
        (dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const relativeBadge =
        diffDays === 0 ? "Hoy" : diffDays === 1 ? "Mañana" : null;

      return { title, relativeBadge };
    }
  }
  const idx = diaSemana ? DAY_INDEX[diaSemana] : undefined;
  return {
    title: idx !== undefined ? DAY_FULL_LABELS[idx] : diaSemana || "Exámenes",
    relativeBadge: null,
  };
}

function getItemColors(item: ScheduleItem) {
  return CARRERA_COLORS[item.carrera_codigo] ?? DEFAULT_COLORS;
}

function ListView({ items }: { items: ScheduleItem[] }) {
  const grouped = useMemo(() => {
    const hasFechas = items.some((i) => Boolean(i.fecha));

    if (hasFechas) {
      const map = new Map<string, ScheduleItem[]>();
      for (const item of items) {
        const key = item.fecha || item.dia_semana || "sin-fecha";
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
      }
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, groupItems]) => {
          const sample = groupItems[0];
          const { title, relativeBadge } = formatFechaGroupHeader(
            sample.fecha,
            sample.dia_semana,
          );
          return {
            key,
            label: title,
            relativeBadge,
            items: groupItems.sort(
              (a, b) => getMinutes(a.hora_inicio) - getMinutes(b.hora_inicio),
            ),
          };
        });
    }

    const map = new Map<string, ScheduleItem[]>();
    for (const item of items) {
      const dayKey = item.dia_semana || "lunes";
      const list = map.get(dayKey) ?? [];
      list.push(item);
      map.set(dayKey, list);
    }
    return DAY_NAMES.filter((d) => map.has(d)).map((d) => ({
      key: d,
      label: DAY_FULL_LABELS[DAY_INDEX[d]],
      relativeBadge: null as string | null,
      items: map
        .get(d)!
        .sort((a, b) => getMinutes(a.hora_inicio) - getMinutes(b.hora_inicio)),
    }));
  }, [items]);

  return (
    <div
      className="flex h-full w-full flex-col gap-6 overflow-auto p-6 sm:p-8 custom-scrollbar"
      style={{ fontSize: "var(--text-base)" }}
    >
      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
          <span className="text-base font-medium">
            No hay exámenes para mostrar en esta selección
          </span>
        </div>
      )}
      {grouped.map((group) => (
        <div key={group.key} className="flex flex-col gap-3">
          <div className="sticky -top-6 sm:-top-8 z-10 flex items-center justify-between rounded-3xl bg-white/95 backdrop-blur-md border border-gray-200/80 px-5 py-3.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                {group.label}
              </h3>
              {group.relativeBadge && (
                <span className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 px-3.5 text-sm font-semibold leading-none text-emerald-800">
                  {group.relativeBadge}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-400">
              {group.items.length} {group.items.length === 1 ? "mesa" : "mesas"}
            </span>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {group.items.map((item) => {
              const colors = getItemColors(item);
              const aulaStr = formatAula(item.aula);

              return (
                <div
                  key={item.id}
                  className={`relative flex w-full items-center gap-4 px-5 py-3.5 rounded-3xl border shadow-xs transition-all ${colors.border} ${colors.bg}`}
                >
                  <div
                    className={`w-1.5 self-stretch rounded-full shrink-0 ${colors.accent}`}
                  />

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <span
                      className={`min-w-0 flex-1 hyphens-auto line-clamp-4 break-words text-xl font-semibold leading-snug ${colors.text}`}
                    >
                      {item.materia_nombre}
                    </span>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      {aulaStr && (
                        <span className="inline-flex h-9 items-center justify-center rounded-xl bg-white/80 border border-gray-200/70 px-3.5 text-sm font-semibold leading-none text-gray-700">
                          {aulaStr}
                        </span>
                      )}

                      <div className="inline-flex h-9 w-24 items-center justify-center rounded-xl bg-white/80 border border-gray-200/70 px-3 text-sm font-semibold leading-none text-gray-700 tabular-nums">
                        {item.hora_inicio.slice(0, 5)} hs
                      </div>

                      {item.comision && (
                        <span className="inline-flex h-9 items-center justify-center rounded-xl bg-white/70 border border-gray-200 px-3.5 text-sm font-semibold leading-none text-gray-600">
                          [{item.comision}]
                        </span>
                      )}

                      {item.carrera_codigo && (
                        <span
                          className={`inline-flex h-9 w-16 items-center justify-center rounded-xl border px-2 text-sm font-semibold leading-none ${colors.badge}`}
                        >
                          {item.carrera_codigo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScheduleGrid({
  title,
  items,
  loading,
  error,
  onClose,
  headerGradient,
  colorVariant = "blue",
}: ScheduleGridProps) {
  const [selectedCarrera, setSelectedCarrera] = useState("");

  const uniqueCarreras = useMemo(
    () =>
      [...new Set(items.map((i) => i.carrera_codigo).filter(Boolean))].sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (!selectedCarrera) return items;
    return items.filter((i) => i.carrera_codigo === selectedCarrera);
  }, [items, selectedCarrera]);

  const gradientClass = headerGradient ?? "from-teal-300/50 to-teal-300/60";

  return (
    <motion.div
      variants={overlayContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center w-full h-full rounded-4xl"
    >
      <motion.div
        variants={overlayPanelVariants}
        className="flex flex-col bg-white/85 border border-gray-200 backdrop-blur-2xl w-full h-full overflow-hidden rounded-4xl"
      >
        <div
          className={`flex items-center justify-between p-6 sm:p-8 border-b border-gray-200 bg-linear-to-br ${gradientClass}`}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="shadow-xs text-sm font-medium bg-white/60 hover:bg-white border border-gray-200 px-8 py-1.5 rounded-2xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

        {!loading &&
          !error &&
          items.length > 0 &&
          uniqueCarreras.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-3.5 border-b border-gray-200/80 bg-white/40">
              <div className="flex w-full items-center gap-3">
                <span className="shrink-0 text-sm font-medium text-gray-500">
                  Carrera
                </span>
                <div className="flex flex-1 items-center gap-1 rounded-2xl border border-gray-200 bg-white/60 p-1">
                  {[
                    { value: "", label: "Todas" },
                    ...uniqueCarreras.map((c) => ({ value: c, label: c })),
                  ].map((option) => {
                    const active = selectedCarrera === option.value;
                    return (
                      <button
                        key={option.value || "todas"}
                        type="button"
                        onClick={() => setSelectedCarrera(option.value)}
                        className={`relative flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-sm transition-colors focus:outline-none ${
                          active
                            ? colorVariant === "green"
                              ? "font-semibold text-emerald-950"
                              : "font-semibold text-blue-950"
                            : "font-medium text-gray-600 hover:bg-white/60 hover:text-gray-900"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="examenes-seg-carrera"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 32,
                            }}
                            className={`absolute inset-0 rounded-xl border bg-linear-to-br shadow-xs ${
                              colorVariant === "green"
                                ? "border-emerald-300/60"
                                : "border-blue-300/60"
                            } ${gradientClass}`}
                            aria-hidden
                          />
                        )}
                        <span className="relative z-10">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        <div className="flex-1 overflow-hidden">
          {loading && <ScheduleGridSkeleton />}

          {error && (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && <ListView items={filteredItems} />}
        </div>
      </motion.div>
    </motion.div>
  );
}
