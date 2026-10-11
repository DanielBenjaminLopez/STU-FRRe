import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useHorarios } from "../hooks/useHorarios";
import type { Clase } from "../api/horarios";
import HorariosFull from "./HorariosFull";
import { ClaseListSkeleton } from "../../../shared/components/ui/Skeleton";
import Select from "../../../shared/components/ui/Select";
import VerButton from "../../../shared/components/ui/VerButton";
import { formatAula } from "../../../shared/utils/formatAula";
import { useOnTotemReset } from "../../../shared/context/TotemResetContext";

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

  const horarioTexto =
    clase.hora_inicio && clase.hora_fin
      ? `${clase.hora_inicio.slice(0, 5)} - ${clase.hora_fin.slice(0, 5)}`
      : (clase.hora_inicio?.slice(0, 5) ?? "");

  return (
    <div className="flex flex-col justify-between gap-1.5 w-full min-w-0 max-w-full p-3 border border-gray-200 bg-white/50 rounded-2xl shadow-xs hover:bg-white/70 transition">
      {/* Fila 1: Header contextual (Carrera + Comisión y Horario) */}
      <div className="flex items-center justify-between gap-2 w-full min-w-0 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {clase.carrera_codigo && (
            <div
              className={`w-14 text-center py-0.5 ${badgeColor} ${badgeBorderColor} border font-semibold rounded-xl shrink-0`}
            >
              <span className={`${badgeTextColor} truncate block`}>
                {clase.carrera_codigo}
              </span>
            </div>
          )}
          {clase.comision && (
            <div className="text-center py-0.5 px-2.5 bg-white/70 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl shrink-0">
              <span className="truncate block">{clase.comision}</span>
            </div>
          )}
        </div>
        {horarioTexto && (
          <span className="font-semibold text-gray-500 tabular-nums shrink-0">
            {horarioTexto}
          </span>
        )}
      </div>

      {/* Fila 2: Materia (máximo ancho libre) y Aula */}
      <div className="flex items-center justify-between gap-2.5 w-full pt-0.5 min-w-0">
        <div
          className="text-sm font-medium text-gray-900 min-w-0 flex-1 truncate"
          title={
            clase.comision
              ? `[${clase.comision}] ${clase.materia_nombre}`
              : clase.materia_nombre
          }
        >
          <span>{clase.materia_nombre}</span>
        </div>

        {clase.aula && (
          <div className="w-22 text-center py-0.5 bg-white/70 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl shrink-0">
            <span className="truncate block">{formatAula(clase.aula)}</span>
          </div>
        )}
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
    <div className="w-full min-w-0 h-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
      {clases.map((clase) => (
        <ClaseRow key={clase.id} clase={clase} />
      ))}
    </div>
  );
}

const AUTO_ROTATE_MS = 15_000;
const INACTIVITY_MS = 30_000;

export default function Horarios() {
  const { ahora, siguiente, todas, uniqueCarreras, loading, error } =
    useHorarios();
  const [showFull, setShowFull] = useState(false);
  useOnTotemReset(() => setShowFull(false));
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);
  const isAutoRotating = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: iniciar intervalo de auto-rotate desde un índice
  const startAutoRotate = useCallback(
    (fromIndex: number) => {
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
    },
    [uniqueCarreras],
  );

  // Iniciar auto-rotate cuando hay carreras disponibles
  useEffect(() => {
    if (uniqueCarreras.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }
    if (!isAutoRotating.current) return;

    startAutoRotate(0);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [uniqueCarreras, startAutoRotate]);

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
  const effectiveCarrera =
    selectedCarrera && uniqueCarreras.includes(selectedCarrera)
      ? selectedCarrera
      : null;

  const ahoraFiltrado = effectiveCarrera
    ? ahora.filter((c) => c.carrera_codigo === effectiveCarrera)
    : ahora;
  const siguienteFiltrado = effectiveCarrera
    ? siguiente.filter((c) => c.carrera_codigo === effectiveCarrera)
    : siguiente;

  return (
    <>
      <AnimatePresence>
        {showFull && (
          <HorariosFull
            onClose={() => setShowFull(false)}
            items={todas}
            loading={loading}
            error={error}
          />
        )}
      </AnimatePresence>
      <div className="w-full h-full col-span-4 row-span-2 bg-linear-to-b from-blue-300/50 to-blue-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
        <div className="relative flex flex-row items-center justify-between w-full">
          <span className="text-xl font-semibold shrink-0">
            Horario general
          </span>
          <div className="flex items-center gap-3">
            {uniqueCarreras.length > 0 && (
              <Select
                align="center"
                colorVariant="blue"
                value={effectiveCarrera ?? ""}
                onChange={(val) => handleSelect(val ? val : null)}
                options={[
                  { value: "", label: "Todas" },
                  ...uniqueCarreras.map((c) => ({ value: c, label: c })),
                ]}
                placeholder="Todas"
                triggerClassName="px-6"
                aria-label="Filtrar horarios por carrera"
              />
            )}
            <VerButton onClick={() => setShowFull(true)} />
          </div>
        </div>
        {!loading && error && (
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 w-full h-full min-w-0 overflow-hidden">
          <div className="flex flex-col w-full min-w-0 justify-center items-center gap-2 overflow-hidden">
            <div className="w-full min-w-0 bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
              <span className="text-base font-normal flex flex-col">
                Cursando ahora
              </span>
              {loading && <ClaseListSkeleton count={2} />}
              {!loading && (
                <ClaseList
                  clases={ahoraFiltrado}
                  emptyMessage="No hay clases en este momento"
                />
              )}
              {!loading && error && (
                <span className="text-red-400 text-sm">{error}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col w-full min-w-0 justify-center items-center gap-2 overflow-hidden">
            <div className="w-full min-w-0 bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
              <span className="text-base font-normal flex flex-col">
                A continuación
              </span>
              {loading && <ClaseListSkeleton count={2} />}
              {!loading && (
                <ClaseList
                  clases={siguienteFiltrado}
                  emptyMessage="No hay más clases hoy"
                />
              )}
              {!loading && error && (
                <span className="text-red-400 text-sm">{error}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
