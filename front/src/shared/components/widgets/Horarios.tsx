import { useState } from "react";
import { useHorarios } from "../../hooks/useHorarios";
import type { Clase } from "../../api/horarios";
import HorariosFull from "./HorariosFull";

const badgeColors: Record<string, string> = {
  ISI: "bg-cyan-100",
  IEM: "bg-brown-100",
  IQ: "bg-green-100",
  LAR: "bg-yellow-100",
};

const defaultBadgeColor = "bg-gray-100";

function ClaseRow({ clase }: { clase: Clase }) {
  const badgeColor = badgeColors[clase.carrera_codigo] ?? defaultBadgeColor;

  return (
    <div className="flex flex-col justify-center gap-2 items-start w-full p-4 border border-gray-200 rounded-2xl">
      <span className="text-xs font-medium">
        {clase.hora_inicio} - {clase.hora_fin}
      </span>
      <div className="flex text-sm overflow-hidden text-ellipsis text-nowrap font-normal gap-1">
        <span className="font-semibold">[{clase.comision}]</span>
        {clase.materia_nombre}
      </div>
      <div className="flex gap-2">
        <div
          className={`flex justify-center py-1 ${badgeColor} text-sm font-semibold w-14 rounded-2xl`}
        >
          {clase.carrera_codigo}
        </div>
        <div className="flex justify-center py-1 px-2 bg-gray-200 text-sm font-semibold rounded-2xl w-fit">
          <span className="font-semibold">Aula {clase.aula}</span>
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
        <>
          <ClaseRow key={clase.id} clase={clase} />
          <ClaseRow key={clase.id} clase={clase} />
        </>
      ))}
    </div>
  );
}

function VerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-normal underline"
    >
      Ver horario completo
    </button>
  );
}

export default function Horarios() {
  const { ahora, siguiente, loading, error } = useHorarios();
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      {showFull && <HorariosFull onClose={() => setShowFull(false)} />}

      {loading && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-gray-100 to-gray-200 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 items-center">
            <span className="text-3xl font-semibold">Horario general</span>
            <span className="text-2xl font-normal">Lista de clases</span>
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-gray-400">Cargando horarios...</span>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}

      {!loading && error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-gray-300 to-gray-400 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 items-center">
            <span className="text-3xl font-semibold">Horario general</span>
            <span className="text-2xl font-normal">Lista de clases</span>
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}

      {!loading && !error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-gray-100 to-gray-200 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 items-center">
            <span className="text-3xl font-semibold">Horario general</span>
            <span className="text-2xl font-normal">Lista de clases</span>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden">
            <div className="bg-white/70 rounded-4xl flex flex-col gap-3 items-center p-8 overflow-hidden">
              <span className="w-full text-base font-semibold flex flex-col">
                Cursando ahora
              </span>
              <ClaseList
                clases={ahora}
                emptyMessage="No hay clases en este momento"
              />
            </div>
            <div className="bg-white/70 rounded-4xl flex flex-col gap-3 items-center p-8">
              <span className="w-full text-base font-semibold flex flex-col">
                A continuación
              </span>
              <ClaseList
                clases={siguiente}
                emptyMessage="No hay más clases hoy"
              />
            </div>
          </div>
          <VerButton onClick={() => setShowFull(true)} />
        </div>
      )}
    </>
  );
}
