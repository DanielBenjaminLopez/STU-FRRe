import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MonthMiniGrid from "./MonthMiniGrid";

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export interface CalendarEvent {
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: string;
  titulo: string;
}

interface AnnualCalendarGridProps {
  year: number;
  events: CalendarEvent[];
  selectedTipo: string | null;
  onToggleDay: (date: string) => void;
  onRangeSelect: (from: string, to: string) => void;
}

interface EventMark {
  tipo: string;
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AnnualCalendarGrid({
  year,
  events,
  selectedTipo,
  onToggleDay,
  onRangeSelect,
}: AnnualCalendarGridProps) {
  const [selectingRange, setSelectingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef(false);

  const eventMap = useMemo(() => {
    const map = new Map<string, EventMark>();

    for (const ev of events) {
      const start = ev.fecha_inicio;
      const end = ev.fecha_fin || ev.fecha_inicio;
      const isR = start !== end;

      if (isR) {
        const d = new Date(start + "T00:00:00");
        const last = new Date(end + "T00:00:00");
        let first = true;
        while (d <= last) {
          const k = dateKey(d);
          const existing = map.get(k);
          if (!existing || existing.tipo === ev.tipo) {
            map.set(k, {
              tipo: ev.tipo,
              isStart: first,
              isEnd: d.getTime() === last.getTime(),
              isMiddle: !first && d.getTime() !== last.getTime(),
            });
          }
          d.setDate(d.getDate() + 1);
          first = false;
        }
      } else {
        const existing = map.get(start);
        if (!existing) {
          map.set(start, {
            tipo: ev.tipo,
            isStart: true,
            isEnd: true,
            isMiddle: false,
          });
        }
      }
    }
    return map;
  }, [events]);

  const isRangeType =
    selectedTipo === "mesa_examen" || selectedTipo === "receso_invernal";

  const handleDayClick = useCallback(
    (date: string) => {
      if (isRangeType) return;
      onToggleDay(date);
    },
    [isRangeType, onToggleDay],
  );

  const handleDayMouseDown = useCallback(
    (date: string) => {
      if (!isRangeType) return;
      processedRef.current = false;
      setSelectingRange(true);
      setRangeStart(date);
      setHoverDate(date);
    },
    [isRangeType],
  );

  const handleDayMouseEnter = useCallback(
    (date: string) => {
      if (selectingRange) {
        setHoverDate(date);
      }
    },
    [selectingRange],
  );

  useEffect(() => {
    if (!selectingRange) return;

    function handleMouseUp() {
      if (processedRef.current) return;
      processedRef.current = true;

      setSelectingRange((sel) => {
        if (!sel) return sel;
        setRangeStart((start) => {
          setHoverDate((hover) => {
            if (start && hover) {
              const from = start < hover ? start : hover;
              const to = start < hover ? hover : start;
              onRangeSelect(from, to);
            }
            return null;
          });
          return null;
        });
        return false;
      });
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [selectingRange, onRangeSelect]);

  return (
    <div ref={gridRef} className="select-none">
      <div className="grid grid-cols-4 gap-2">
        {MONTHS.map((m) => (
          <MonthMiniGrid
            key={m}
            year={year}
            month={m}
            events={eventMap}
            onDayClick={handleDayClick}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
            selectingRange={selectingRange}
            rangeStart={rangeStart}
            hoverDate={hoverDate}
          />
        ))}
      </div>
    </div>
  );
}
