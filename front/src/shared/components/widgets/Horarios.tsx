import { useEffect, useRef, useState } from "react";
import { useHorarios } from "../../hooks/useHorarios";
import type { Clase } from "../../api/horarios";
import HorariosFull from "./HorariosFull";
import { ClaseListSkeleton } from "../ui/Skeleton";

const badgeColors: Record<string, string> = {
  ISI: "bg-cyan-100",
  IEM: "bg-amber-100",
  IQ: "bg-green-100",
  LAR: "bg-yellow-100",
};

const defaultBadgeColor = "bg-gray-100";

const badgeTextColors: Record<string, string> = {
  ISI: "text-cyan-800",
  IEM: "text-amber-800",
  IQ: "text-green-800",
  LAR: "text-yellow-800",
};

const defaultBadgeTextColor = "text-gray-800";

const badgeBorderColors: Record<string, string> = {
  ISI: "border-cyan-200",
  IEM: "border-amber-200",
  IQ: "border-green-200",
  LAR: "border-yellow-200",
};

const defaultBadgeBorderColor = "border-gray-200";

function ClaseRow({ clase }: { clase: Clase }) {
  const badgeColor = badgeColors[clase.carrera_codigo] ?? defaultBadgeColor;
  const badgeTextColor =
    badgeTextColors[clase.carrera_codigo] ?? defaultBadgeTextColor;
  const badgeBorderColor =
    badgeBorderColors[clase.carrera_codigo] ?? defaultBadgeBorderColor;

  return (
    <div className="flex flex-col justify-center gap-2 items-start w-full p-4 border border-gray-200 bg-white/50 rounded-2xl">
      <span className="text-xs font-medium">
        {clase.hora_inicio} - {clase.hora_fin}
      </span>
      <div className="flex text-sm overflow-hidden text-ellipsis text-nowrap font-normal gap-1">
        <span className="font-semibold">[{clase.comision}]</span>
        {clase.materia_nombre}
      </div>
      <div className="flex gap-2">
        <div
          className={`flex justify-center py-1 ${badgeColor} ${badgeBorderColor} border text-sm font-semibold w-14 rounded-2xl`}
        >
          <span className={badgeTextColor}>{clase.carrera_codigo}</span>
        </div>
        <div className="flex justify-center py-1 px-2 bg-white/50 text-sm font-semibold rounded-2xl w-fit">
          <span className="font-semibold">{clase.aula}</span>
        </div>
      </div>
    </div>
  );
}

function ClaseList({
  clases,
  emptyMessage,
}: {
  clases: Clase[];
  emptyMessage: string;
}) {
  if (clases.length === 0) {
    return (
      <span className="text-sm font-normal text-gray-400 text-center w-full pt-4">
        {emptyMessage}
      </span>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-1 overflow-auto">
      {clases.map((clase) => (
        <ClaseRow key={clase.id} clase={clase} />
      ))}
    </div>
  );
}

function VerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shadow-xs text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
    >
      Ver horario completo
    </button>
  );
}

function CarreraFilter({
  carreras,
  selected,
  onSelect,
}: {
  carreras: string[];
  selected: string | null;
  onSelect: (codigo: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {carreras.map((c) => {
        const isActive = selected === c;
        const bg = isActive
          ? (badgeColors[c] ?? defaultBadgeColor)
          : "bg-white";
        const border = isActive
          ? (badgeBorderColors[c] ?? defaultBadgeBorderColor)
          : "border-gray-200";
        const text = isActive
          ? (badgeTextColors[c] ?? defaultBadgeTextColor)
          : "text-gray-400";

        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(isActive ? null : c)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${bg} ${border} ${text}`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

const AUTO_ROTATE_MS = 15_000;
const INACTIVITY_MS = 30_000;

export default function Horarios() {
  const { ahora, siguiente, uniqueCarreras, loading, error } = useHorarios();
  const [showFull, setShowFull] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);
  const isAutoRotating = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: iniciar intervalo de auto-rotate desde un índice
  function startAutoRotate(fromIndex: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedCarrera(uniqueCarreras[fromIndex]);
    isAutoRotating.current = true;

    timerRef.current = setInterval(() => {
      setSelectedCarrera((prev) => {
        const currentIdx = uniqueCarreras.indexOf(prev ?? "");
        const next = (currentIdx + 1) % uniqueCarreras.length;
        return uniqueCarreras[next];
      });
    }, AUTO_ROTATE_MS);
  }

  // Iniciar auto-rotate cuando hay carreras disponibles
  useEffect(() => {
    if (uniqueCarreras.length === 0) return;
    if (!isAutoRotating.current) return;

    startAutoRotate(0);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [uniqueCarreras]);

  // Handler para selección manual
  function handleSelect(codigo: string | null) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    isAutoRotating.current = false;
    setSelectedCarrera(codigo);

    // Reactivar auto-rotate después de inactividad
    inactivityTimerRef.current = setTimeout(() => {
      const currentIndex = codigo ? uniqueCarreras.indexOf(codigo) : 0;
      startAutoRotate(currentIndex >= 0 ? currentIndex : 0);
    }, INACTIVITY_MS);
  }

  // Filtrar por carrera seleccionada
  const ahoraFiltrado = selectedCarrera
    ? ahora.filter((c) => c.carrera_codigo === selectedCarrera)
    : ahora;
  const siguienteFiltrado = selectedCarrera
    ? siguiente.filter((c) => c.carrera_codigo === selectedCarrera)
    : siguiente;

  return (
    <>
      {showFull && <HorariosFull onClose={() => setShowFull(false)} />}

      {loading && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-blue-300/50 to-blue-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full justify-between">
            <span className="text-xl font-semibold">Horario general</span>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden">
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal">Cursando ahora</span>
                <ClaseListSkeleton count={2} />
              </div>
            </div>
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal">A continuación</span>
                <ClaseListSkeleton count={2} />
              </div>
            </div>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}

      {!loading && error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-blue-300/50 to-blue-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full justify-between">
            <span className="text-xl font-semibold">Horario general</span>
            {/* <span className="text-2xl font-normal">Lista de clases</span> */}
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}

      {!loading && !error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-blue-300/50 to-blue-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="relative flex flex-row items-center gap-2 w-full justify-between">
            <span className="text-xl font-semibold shrink-0">
              Horario general
            </span>
            <CarreraFilter
              carreras={uniqueCarreras}
              selected={selectedCarrera}
              onSelect={handleSelect}
            />
            <VerButton onClick={() => setShowFull(true)} />
          </div>
          <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden">
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal flex flex-col">
                  Cursando ahora
                </span>
                <ClaseList
                  clases={ahoraFiltrado}
                  emptyMessage="No hay clases en este momento"
                />
              </div>
            </div>
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal flex flex-col">
                  A continuación
                </span>
                <ClaseList
                  clases={siguienteFiltrado}
                  emptyMessage="No hay más clases hoy"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
