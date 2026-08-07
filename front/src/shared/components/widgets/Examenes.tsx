import { useState } from "react";
import { useExamenes } from "../../hooks/useExamenes";
import type { Examen } from "../../api/examenes";
import ExamenesFull from "./ExamenesFull";
import { ClaseListSkeleton } from "../ui/Skeleton";

const badgeColors: Record<string, string> = {
  ISI: "bg-cyan-100",
  IEM: "bg-brown-100",
  IQ: "bg-green-100",
  LAR: "bg-yellow-100",
};

const defaultBadgeColor = "bg-gray-100";

function ExamenRow({ examen }: { examen: Examen }) {
  const badgeColor = badgeColors[examen.carrera_codigo] ?? defaultBadgeColor;

  return (
    <div className="flex flex-col justify-center gap-2 items-start w-full p-4 border border-gray-200 bg-white/50 rounded-2xl">
      <span className="text-xs font-medium">
        {examen.hora_inicio} - {examen.hora_fin}
      </span>
      <div className="flex text-sm overflow-hidden text-ellipsis text-nowrap font-normal gap-1">
        <span className="font-semibold">[{examen.comision}]</span>
        {examen.materia_nombre}
      </div>
      <div className="flex gap-2">
        <div
          className={`flex justify-center py-1 ${badgeColor} text-sm font-semibold w-14 rounded-2xl`}
        >
          {examen.carrera_codigo}
        </div>
        <div className="flex justify-center py-1 px-2 bg-white/50 text-sm font-semibold rounded-2xl w-fit">
          <span className="font-semibold">Aula {examen.aula}</span>
        </div>
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
    <div className="w-full h-full flex flex-col gap-1 overflow-auto">
      {examenes.map((examen) => (
        <ExamenRow key={examen.id} examen={examen} />
      ))}
    </div>
  );
}

function VerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shadow-xs absolute top-1/2 -translate-y-1/2 right-0 text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
    >
      Ver horario completo
    </button>
  );
}

export default function Examenes() {
  const { ahora, siguiente, loading, error } = useExamenes();
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      {showFull && <ExamenesFull onClose={() => setShowFull(false)} />}

      {loading && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-green-300/50 to-green-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full">
            <span className="text-xl font-semibold">Horario de examenes</span>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden">
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal">Cursando ahora</span>
                <ClaseListSkeleton count={3} />
              </div>
            </div>
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal">A continuación</span>
                <ClaseListSkeleton count={3} />
              </div>
            </div>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}

      {!loading && error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-green-300/50 to-green-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full">
            <span className="text-xl font-semibold">Horario de examenes</span>
            {/* <span className="text-2xl font-normal">Lista de clases</span> */}
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}

      {!loading && !error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-green-300/50 to-green-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="relative flex flex-row gap-2 w-full">
            <span className="text-xl font-semibold">Horario de examenes</span>
            <VerButton onClick={() => setShowFull(true)} />
            {/* <span className="text-2xl font-normal">Lista de clases</span> */}
          </div>
          <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden">
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal flex flex-col">
                  Cursando ahora
                </span>
                <ExamenList
                  examenes={ahora}
                  emptyMessage="No hay examenes en este momento"
                />
              </div>
            </div>
            <div className="flex flex-col w-full justify-center items-center gap-2 overflow-hidden">
              <div className="w-full bg-white/50 border border-gray-200 rounded-4xl flex flex-col gap-3 items-center p-4 h-full overflow-hidden">
                <span className="text-base font-normal flex flex-col">
                  A continuación
                </span>
                <ExamenList
                  examenes={siguiente}
                  emptyMessage="No hay más examenes hoy"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
