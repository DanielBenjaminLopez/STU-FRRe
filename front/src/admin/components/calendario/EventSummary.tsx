interface SummaryEvent {
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
}

interface EventSummaryProps {
  events: SummaryEvent[];
  onDeleteEvent: (index: number) => void;
}

function formatDate(s: string) {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
}

const TIPO_BADGE: Record<string, string> = {
  inicio_cuatrimestre: "bg-emerald-100 text-emerald-700",
  fin_cuatrimestre: "bg-emerald-100 text-emerald-700",
  mesa_examen: "bg-red-100 text-red-700",
  receso_invernal: "bg-violet-100 text-violet-700",
  feriado: "bg-amber-100 text-amber-700",
};

const TIPO_SHORT: Record<string, string> = {
  inicio_cuatrimestre: "Inicio",
  fin_cuatrimestre: "Fin",
  mesa_examen: "Mesa",
  receso_invernal: "Receso",
  feriado: "Feriado",
};

export default function EventSummary({
  events,
  onDeleteEvent,
}: EventSummaryProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-[11px] text-gray-400">
        Marcá días en el calendario para agregar eventos.
      </div>
    );
  }

  const reversed = [...events].reverse();

  return (
    <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto pr-1">
      {reversed.map((ev, i) => {
        const realIdx = events.length - 1 - i;
        return (
          <div
            key={`${ev.tipo}-${ev.fecha_inicio}-${realIdx}`}
            className="flex items-center gap-2 text-xs text-slate-600 bg-gray-50 rounded-xl px-2.5 py-1.5"
          >
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${TIPO_BADGE[ev.tipo] || "bg-gray-100 text-gray-600"}`}
            >
              {TIPO_SHORT[ev.tipo] || ev.tipo}
            </span>
            <span className="flex-1 truncate">
              {formatDate(ev.fecha_inicio)}
              {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio
                ? ` — ${formatDate(ev.fecha_fin)}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => onDeleteEvent(realIdx)}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0 text-xs"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
