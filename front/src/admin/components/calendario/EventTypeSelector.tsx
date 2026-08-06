import { EVENT_TYPES } from "./eventTypes";

interface EventTypeSelectorProps {
  selected: string | null;
  onSelect: (tipo: string | null) => void;
}

function TipoIcon({ tipo }: { tipo: string }) {
  const cls = "w-4 h-4 shrink-0";
  switch (tipo) {
    case "inicio_cuatrimestre":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 11v4m-2-2h4"
          />
        </svg>
      );
    case "fin_cuatrimestre":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14l2 2 4-4"
          />
        </svg>
      );
    case "mesa_examen":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "receso_invernal":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    case "feriado":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
    default:
      return null;
  }
}

const MODE_HINT: Record<string, string> = {
  day: "Hacé click en un día",
  range: "Arrastrá para seleccionar un rango",
};

export default function EventTypeSelector({
  selected,
  onSelect,
}: EventTypeSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {EVENT_TYPES.map((t) => {
          const isActive = selected === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelect(isActive ? null : t.value)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                ${
                  isActive
                    ? `${t.bg} ${t.border} ring-2 ${t.ring} ring-offset-1 shadow-sm`
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <span
                className={`${isActive ? t.color : "text-gray-400"} transition-colors`}
              >
                <TipoIcon tipo={t.value} />
              </span>
              <span className={isActive ? "text-gray-900" : "text-gray-700"}>
                {t.label}
              </span>
              <span
                className={`text-[10px] font-normal px-1.5 py-0.5 rounded-md ${
                  isActive
                    ? "bg-white/60 text-gray-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {t.mode === "day" ? "click" : "arrastrar"}
              </span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {
            MODE_HINT[
              EVENT_TYPES.find((t) => t.value === selected)?.mode || "day"
            ]
          }
        </p>
      ) : (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          Elegí un tipo de evento arriba para comenzar
        </p>
      )}
    </div>
  );
}
