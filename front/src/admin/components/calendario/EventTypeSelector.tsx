import { EVENT_TYPES } from "./eventTypes";

interface EventTypeSelectorProps {
  selected: string | null;
  onSelect: (tipo: string | null) => void;
}

export default function EventTypeSelector({
  selected,
  onSelect,
}: EventTypeSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {EVENT_TYPES.map((t) => {
        const isActive = selected === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(isActive ? null : t.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all
              ${
                isActive
                  ? `${t.bg} ${t.border} ring-1 ${t.ring} ring-offset-1`
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${t.color} shrink-0`} />
            <span>{t.label}</span>
            <span className="text-[9px] text-gray-400 font-normal">
              {t.mode === "day" ? "click" : "drag"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
