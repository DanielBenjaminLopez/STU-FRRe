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
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Seleccioná un tipo de evento
          <br />y marcá días en el calendario
        </p>
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
