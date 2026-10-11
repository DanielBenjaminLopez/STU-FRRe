import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useExamenes } from "../hooks/useExamenes";
import type { Examen } from "../api/examenes";
import ExamenesFull from "./ExamenesFull";
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

function ExamenRow({ examen }: { examen: Examen }) {
  const badgeColor = badgeColors[examen.carrera_codigo] ?? defaultBadgeColor;
  const badgeTextColor =
    badgeTextColors[examen.carrera_codigo] ?? defaultBadgeTextColor;
  const badgeBorderColor =
    badgeBorderColors[examen.carrera_codigo] ?? defaultBadgeBorderColor;

  const horarioTexto =
    examen.hora_inicio && examen.hora_fin
      ? `${examen.hora_inicio.slice(0, 5)} - ${examen.hora_fin.slice(0, 5)}`
      : (examen.hora_inicio?.slice(0, 5) ?? "");

  return (
    <div className="flex flex-col justify-between gap-1.5 w-full min-w-0 max-w-full p-3 border border-gray-200 bg-white/50 rounded-2xl shadow-xs hover:bg-white/70 transition">
      {/* Fila 1: Header contextual (Carrera + Comisión y Horario) */}
      <div className="flex items-center justify-between gap-2 w-full min-w-0 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {examen.carrera_codigo && (
            <div
              className={`w-14 text-center py-0.5 ${badgeColor} ${badgeBorderColor} border font-semibold rounded-xl shrink-0`}
            >
              <span className={`${badgeTextColor} truncate block`}>
                {examen.carrera_codigo}
              </span>
            </div>
          )}
          {examen.comision && (
            <div className="text-center py-0.5 px-2.5 bg-white/70 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl shrink-0">
              <span className="truncate block">{examen.comision}</span>
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
            examen.comision
              ? `[${examen.comision}] ${examen.materia_nombre}`
              : examen.materia_nombre
          }
        >
          <span>{examen.materia_nombre}</span>
        </div>

        {examen.aula && (
          <div className="w-22 text-center py-0.5 bg-white/70 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl shrink-0">
            <span className="truncate block">{formatAula(examen.aula)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ExamenList({
  examenes,
  emptyMessage,
}: {
  examenes: Examen[];
  emptyMessage: string;
}) {
  if (examenes.length === 0) {
    return (
      <span className="text-sm font-normal text-gray-400 text-center w-full pt-4">
        {emptyMessage}
      </span>
    );
  }

  return (
    <div className="w-full min-w-0 h-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
      {examenes.map((examen) => (
        <ExamenRow key={examen.id} examen={examen} />
      ))}
    </div>
  );
}

export default function Examenes() {
  const {
    ahora,
    siguiente,
    todas,
    uniqueCarreras = [],
    loading,
    error,
  } = useExamenes();
  const [showFull, setShowFull] = useState(false);
  useOnTotemReset(() => setShowFull(false));
  const [selectedCarrera, setSelectedCarrera] = useState<string>("");

  const effectiveCarrera =
    selectedCarrera && uniqueCarreras.includes(selectedCarrera)
      ? selectedCarrera
      : "";

  const ahoraFiltrado = effectiveCarrera
    ? ahora.filter((e) => e.carrera_codigo === effectiveCarrera)
    : ahora;
  const siguienteFiltrado = effectiveCarrera
    ? siguiente.filter((e) => e.carrera_codigo === effectiveCarrera)
    : siguiente;

  return (
    <>
      <AnimatePresence>
        {showFull && (
          <ExamenesFull
            onClose={() => setShowFull(false)}
            items={todas}
            loading={loading}
            error={error}
          />
        )}
      </AnimatePresence>
      <div className="w-full h-full col-span-4 row-span-2 bg-linear-to-b from-green-300/50 to-green-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
        <div className="relative flex flex-row items-center justify-between w-full">
          <span className="text-xl font-semibold shrink-0">
            Horario de examenes
          </span>
          <div className="flex items-center gap-3">
            {uniqueCarreras.length > 0 && (
              <Select
                align="center"
                colorVariant="green"
                value={effectiveCarrera}
                onChange={setSelectedCarrera}
                options={[
                  { value: "", label: "Todas" },
                  ...uniqueCarreras.map((c) => ({ value: c, label: c })),
                ]}
                placeholder="Todas"
                triggerClassName="px-6"
                aria-label="Filtrar exámenes por carrera"
              />
            )}
            <VerButton onClick={() => setShowFull(true)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full h-full min-w-0 overflow-hidden">
          <div className="flex flex-col w-full min-w-0 justify-center items-center gap-2 overflow-hidden">
            <div className="w-full min-w-0 bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
              <span className="text-base font-normal flex flex-col">
                Cursando ahora
              </span>
              {loading && <ClaseListSkeleton count={3} />}
              {!loading && !error && (
                <ExamenList
                  examenes={ahoraFiltrado}
                  emptyMessage="No hay examenes en este momento"
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
              {loading && <ClaseListSkeleton count={3} />}
              {!loading && !error && (
                <ExamenList
                  examenes={siguienteFiltrado}
                  emptyMessage="No hay más examenes hoy"
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
