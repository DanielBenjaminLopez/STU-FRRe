import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useExamenes } from "../../hooks/useExamenes";
import type { Examen } from "../../api/examenes";
import ExamenesFull from "./ExamenesFull";
import { ClaseListSkeleton } from "../ui/Skeleton";
import Select from "../ui/Select";
import VerButton from "../ui/VerButton";
import { formatAula } from "../../utils/formatAula";

const badgeColors: Record<string, string> = {
  ISI: "bg-cyan-100",
  IEM: "bg-amber-100",
  IQ: "bg-green-100",
  LAR: "bg-yellow-100",
};

const defaultBadgeColor = "bg-gray-100";

function ExamenRow({ examen }: { examen: Examen }) {
  const badgeColor = badgeColors[examen.carrera_codigo] ?? defaultBadgeColor;

  return (
    <div className="flex flex-col justify-center gap-2 items-start w-full min-w-0 max-w-full p-4 border border-gray-200 bg-white/50 rounded-2xl">
      <span className="text-xs font-medium shrink-0">
        {examen.hora_inicio?.slice(0, 5)} - {examen.hora_fin?.slice(0, 5)}
      </span>
      <div
        className="text-sm font-normal min-w-0 w-full line-clamp-2 break-words"
        title={
          examen.comision
            ? `[${examen.comision}] ${examen.materia_nombre}`
            : examen.materia_nombre
        }
      >
        {examen.comision && (
          <span className="font-semibold mr-1.5 shrink-0">
            [{examen.comision}]
          </span>
        )}
        <span>{examen.materia_nombre}</span>
      </div>
      <div className="flex flex-wrap gap-2 max-w-full">
        {examen.carrera_codigo && (
          <div
            className={`flex justify-center py-1 px-3 w-fit max-w-full ${badgeColor} text-sm font-semibold rounded-2xl shrink-0`}
          >
            <span className="truncate">{examen.carrera_codigo}</span>
          </div>
        )}
        {examen.aula && (
          <div className="flex justify-center py-1 px-2 bg-white/50 text-sm font-semibold rounded-2xl w-fit max-w-full shrink-0">
            <span className="font-semibold truncate">
              {formatAula(examen.aula)}
            </span>
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
    uniqueCarreras = [],
    loading,
    error,
  } = useExamenes();
  const [showFull, setShowFull] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState<string>("");

  const ahoraFiltrado = selectedCarrera
    ? ahora.filter((e) => e.carrera_codigo === selectedCarrera)
    : ahora;
  const siguienteFiltrado = selectedCarrera
    ? siguiente.filter((e) => e.carrera_codigo === selectedCarrera)
    : siguiente;

  return (
    <>
      <AnimatePresence>
        {showFull && <ExamenesFull onClose={() => setShowFull(false)} />}
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
                value={selectedCarrera}
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
