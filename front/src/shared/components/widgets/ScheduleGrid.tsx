import { useMemo, useState } from "react";

export interface ScheduleItem {
  id: number;
  carrera_codigo: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
}

export interface ScheduleGridProps {
  title: string;
  items: ScheduleItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  loadingText?: string;
}

const HOURS_START = 8;
const HOURS_END = 20;
const HOUR_HEIGHT = 64;

const CARRERA_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  ISI: { bg: "bg-cyan-100", border: "border-cyan-200", text: "text-cyan-800" },
  IEM: {
    bg: "bg-amber-100",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  IQ: {
    bg: "bg-green-100",
    border: "border-green-200",
    text: "text-green-800",
  },
  LAR: {
    bg: "bg-yellow-100",
    border: "border-yellow-200",
    text: "text-yellow-800",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-gray-100",
  border: "border-gray-200",
  text: "text-gray-800",
};

const DAY_NAMES = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_FULL_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const DAY_INDEX: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
};

type ViewMode = "day" | "week" | "list";

function getMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatDateTitle(date: Date, view: ViewMode): string {
  if (view === "day") {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (view === "week") {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 5);
    return `${formatDateShort(monday)} – ${formatDateShort(sunday)}`;
  }
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getItemColors(item: ScheduleItem): {
  bg: string;
  border: string;
  text: string;
} {
  return CARRERA_COLORS[item.carrera_codigo] ?? DEFAULT_COLORS;
}

interface PositionedEvent {
  item: ScheduleItem;
  top: number;
  height: number;
  left: number;
  width: number;
}

function layoutOverlapping(items: ScheduleItem[]): PositionedEvent[] {
  if (items.length === 0) return [];

  const positioned: PositionedEvent[] = items
    .map((item) => {
      const startMin = getMinutes(item.hora_inicio);
      const endMin = getMinutes(item.hora_fin);
      const top = ((startMin - HOURS_START * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
      return { item, top, height, left: 0, width: 100 };
    })
    .sort((a, b) => a.top - b.top || a.height - b.height);

  const columns: PositionedEvent[][] = [];

  for (const evt of positioned) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (evt.top >= lastInCol.top + lastInCol.height) {
        columns[col].push(evt);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([evt]);
    }
  }

  const totalCols = columns.length;
  for (const col of columns) {
    for (let i = 0; i < col.length; i++) {
      col[i].left = (i / totalCols) * 100;
      col[i].width = 100 / totalCols;
    }
  }

  return positioned;
}

function TimeGrid({
  items,
  date,
  isWeek,
}: {
  items: ScheduleItem[];
  date: Date;
  isWeek: boolean;
}) {
  const hours: number[] = [];
  for (let h = HOURS_START; h < HOURS_END; h++) {
    hours.push(h);
  }

  const weekMonday = getMonday(date);
  const dayColumns: { label: string; date: Date; items: ScheduleItem[] }[] = [];

  if (isWeek) {
    for (let i = 0; i < 6; i++) {
      const d = new Date(weekMonday);
      d.setDate(d.getDate() + i);
      const dayName = DAY_NAMES[i];
      dayColumns.push({
        label: DAY_LABELS[i],
        date: d,
        items: items.filter((c) => c.dia_semana === dayName),
      });
    }
  } else {
    const dayName =
      DAY_NAMES.find(
        (n) => DAY_INDEX[n] === (date.getDay() === 0 ? 6 : date.getDay() - 1),
      ) ?? DAY_NAMES[0];
    dayColumns.push({
      label: DAY_LABELS[DAY_INDEX[dayName]],
      date: new Date(date),
      items: items.filter((c) => c.dia_semana === dayName),
    });
  }

  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="flex flex-col h-full overflow-hidden mx-8">
      <div className="flex border-b border-gray-200 shrink-0">
        <div className="w-16 shrink-0" />
        {dayColumns.map((col) => (
          <div
            key={col.label + col.date.toISOString()}
            className="flex-1 py-3 text-center text-sm font-semibold text-gray-600 border-l border-gray-200"
          >
            <div>{col.label}</div>
            <div className="text-xs font-normal text-gray-400">
              {col.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-auto">
        <div className="w-16 shrink-0 relative" style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start justify-end pr-2"
              style={{ top: (h - HOURS_START) * HOUR_HEIGHT }}
            >
              <span className="text-xs text-gray-400 -mt-2">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {dayColumns.map((col) => {
          const positioned = layoutOverlapping(col.items);
          return (
            <div
              key={col.label + col.date.toISOString()}
              className="flex-1 relative border-l border-gray-200"
              style={{ height: totalHeight }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: (h - HOURS_START) * HOUR_HEIGHT }}
                />
              ))}

              {positioned.map((evt) => {
                const colors = getItemColors(evt.item);
                return (
                  <div
                    key={evt.item.id}
                    className={`absolute rounded-lg border px-2 py-1 overflow-hidden cursor-default ${colors.bg} ${colors.border}`}
                    style={{
                      top: evt.top + 1,
                      height: evt.height - 2,
                      left: `${evt.left}%`,
                      width: `${evt.width - 1}%`,
                    }}
                    title={`${evt.item.carrera_codigo} - ${evt.item.materia_nombre}\n[${evt.item.comision}] - Aula ${evt.item.aula}`}
                  >
                    <div
                      className={`text-xs font-semibold leading-tight ${colors.text} truncate`}
                    >
                      {evt.item.materia_nombre}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                      {evt.item.hora_inicio} - {evt.item.hora_fin}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight truncate">
                      [{evt.item.comision}] · Aula {evt.item.aula}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ items }: { items: ScheduleItem[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const item of items) {
      const list = map.get(item.dia_semana) ?? [];
      list.push(item);
      map.set(item.dia_semana, list);
    }
    return DAY_NAMES.filter((d) => map.has(d)).map((d) => ({
      day: d,
      label: DAY_FULL_LABELS[DAY_INDEX[d]],
      items: map
        .get(d)!
        .sort((a, b) => getMinutes(a.hora_inicio) - getMinutes(b.hora_inicio)),
    }));
  }, [items]);

  return (
    <div className="flex flex-col gap-6 overflow-auto p-4 h-full mx-4">
      {grouped.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400">No hay elementos para mostrar</span>
        </div>
      )}
      {grouped.map((group) => (
        <div key={group.day} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {group.label}
          </h3>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => {
              const colors = getItemColors(item);
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${colors.border} ${colors.bg}`}
                >
                  <div className="shrink-0 text-xs font-semibold text-gray-500 mt-0.5 min-w-20">
                    {item.hora_inicio} - {item.hora_fin}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span
                      className={`text-sm font-semibold ${colors.text} truncate`}
                    >
                      {item.materia_nombre}
                    </span>
                    <span className="text-xs text-gray-500">
                      [{item.comision}] · Aula {item.aula} ·{" "}
                      {item.carrera_codigo}
                    </span>
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
  loadingText = "Cargando...",
}: ScheduleGridProps) {
  const [view, setView] = useState<ViewMode>("day");
  const [date, setDate] = useState(() => new Date());

  const dateTitle = useMemo(() => formatDateTitle(date, view), [date, view]);

  function navigateToday() {
    setDate(new Date());
  }

  function navigatePrev() {
    setDate((d) => {
      const nd = new Date(d);
      if (view === "week") {
        nd.setDate(nd.getDate() - 7);
      } else {
        nd.setDate(nd.getDate() - 1);
      }
      return nd;
    });
  }

  function navigateNext() {
    setDate((d) => {
      const nd = new Date(d);
      if (view === "week") {
        nd.setDate(nd.getDate() + 7);
      } else {
        nd.setDate(nd.getDate() + 1);
      }
      return nd;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white w-full h-full overflow-hidden rounded-4xl">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setView("day")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  view === "day"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setView("week")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  view === "week"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  view === "list"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {view !== "list" && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={navigatePrev}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={navigateToday}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={navigateNext}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            )}

            <span className="text-sm font-medium text-gray-700 min-w-48 text-center capitalize">
              {dateTitle}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="text-sm font-normal underline text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">{loadingText}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && view === "day" && (
            <TimeGrid items={items} date={date} isWeek={false} />
          )}

          {!loading && !error && view === "week" && (
            <TimeGrid items={items} date={date} isWeek={true} />
          )}

          {!loading && !error && view === "list" && <ListView items={items} />}
        </div>
      </div>
    </div>
  );
}
