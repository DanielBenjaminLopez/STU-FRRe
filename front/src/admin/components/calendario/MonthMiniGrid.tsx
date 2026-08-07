import { useMemo } from "react";

const DIAS_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface EventMark {
  tipo: string;
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
}

interface MonthMiniGridProps {
  year: number;
  month: number;
  events: Map<string, EventMark>;
  onDayClick: (date: string) => void;
  onDayMouseDown: (date: string) => void;
  onDayMouseEnter: (date: string) => void;
  selectingRange: boolean;
  rangeStart: string | null;
  hoverDate: string | null;
}

const TIPO_COLORS: Record<string, string> = {
  inicio_cuatrimestre: "bg-emerald-300",
  fin_cuatrimestre: "bg-emerald-300",
  mesa_examen: "bg-red-300",
  receso_invernal: "bg-violet-300",
  feriado: "bg-amber-300",
};

export default function MonthMiniGrid({
  year,
  month,
  events,
  onDayClick,
  onDayMouseDown,
  onDayMouseEnter,
  selectingRange,
  rangeStart,
  hoverDate,
}: MonthMiniGridProps) {
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const monthName = new Date(year, month).toLocaleDateString("es-AR", {
    month: "long",
  });

  const rangeDates = useMemo(() => {
    if (!selectingRange || !rangeStart || !hoverDate) return new Set<string>();
    const dates = new Set<string>();
    const s = rangeStart < hoverDate ? rangeStart : hoverDate;
    const e = rangeStart < hoverDate ? hoverDate : rangeStart;
    const d = new Date(s + "T00:00:00");
    const end = new Date(e + "T00:00:00");
    while (d <= end) {
      dates.add(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, [selectingRange, rangeStart, hoverDate]);

  const cells: {
    day: number;
    key: string;
    mark?: EventMark;
    inRange: boolean;
  }[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: 0, key: `empty-${i}`, inRange: false });
  }
  for (let day = 1; day <= totalDays; day++) {
    const key = dateKey(year, month, day);
    cells.push({
      day,
      key,
      mark: events.get(key),
      inRange: rangeDates.has(key),
    });
  }

  function getBgClass(mark?: EventMark, inRange?: boolean) {
    if (inRange && !mark) return "bg-sky-100";
    if (!mark) return "";
    const base = TIPO_COLORS[mark.tipo] || "bg-gray-200";
    if (mark.isMiddle) return `${base} rounded-none`;
    if (mark.isStart && mark.isEnd) return `${base} rounded-full`;
    if (mark.isStart) return `${base} rounded-l-full`;
    if (mark.isEnd) return `${base} rounded-r-full`;
    return `${base} rounded-full`;
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-1">
      <p className="text-[10px] font-bold text-slate-700 capitalize mb-0.5 text-center">
        {monthName}
      </p>
      <div className="grid grid-cols-7 gap-px">
        {DIAS_CORTOS.map((d) => (
          <div
            key={d}
            className="text-center text-[7px] font-medium text-slate-400 py-0.5"
          >
            {d}
          </div>
        ))}
        {cells.map((c) => (
          <div
            key={c.key}
            onMouseDown={() => c.day > 0 && onDayMouseDown(c.key)}
            onMouseEnter={() => c.day > 0 && onDayMouseEnter(c.key)}
            onClick={() => c.day > 0 && !selectingRange && onDayClick(c.key)}
            className={`
              h-4 flex items-center justify-center text-[11px] select-none rounded-md
              ${c.day === 0 ? "" : "cursor-pointer hover:bg-gray-100"}
              ${c.mark ? getBgClass(c.mark, c.inRange) : c.inRange ? "bg-sky-100 rounded-none" : ""}
              ${!c.mark && !c.inRange && c.day !== 0 ? "text-slate-700" : ""}
              ${c.mark ? "text-slate-900 font-medium" : ""}
            `}
          >
            {c.day > 0 ? c.day : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
