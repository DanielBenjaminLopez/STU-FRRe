import { EVENT_TYPES } from "./eventTypes";

interface EventTypeSelectorProps {
  selected: string | null;
  onSelect: (tipo: string | null) => void;
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
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {EVENT_TYPES.map((t) => {
          const isActive = selected === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelect(isActive ? null : t.value)}
              className={`
                flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all
                ${
                  isActive
                    ? `${t.bg} ${t.border} shadow-sm`
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.color}`}
              />
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
