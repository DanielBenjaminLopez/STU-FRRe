import { useHorarios } from "../../hooks/useHorarios";
import type { Clase } from "../../api/horarios";

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
    <div className="flex justify-between items-center">
      <div className="flex gap-2 items-center w-full">
        <div
          className={`flex justify-center py-1 ${badgeColor} text-sm font-semibold w-12 rounded-full`}
        >
          {clase.carrera_codigo}
        </div>
        <div className="flex justify-center py-1 bg-gray-200 text-sm font-semibold w-12 rounded-full">
          {clase.comision}
        </div>
        <span className="text-sm overflow-hidden text-ellipsis text-nowrap font-normal flex-1">
          {clase.materia_nombre}
        </span>
        <span className="text-sm font-medium w-12 text-right">
          {clase.hora_inicio}
        </span>
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
    <div className="w-full h-full flex flex-col gap-3">
      {clases.map((clase) => (
        <ClaseRow key={clase.id} clase={clase} />
      ))}
    </div>
  );
}

export default function Horarios() {
  const { ahora, siguiente, loading, error } = useHorarios();

  if (loading) {
    return (
      <div className="col-span-4 row-span-2 bg-linear-to-b from-gray-100 to-gray-200 rounded-4xl flex flex-col gap-4 items-center p-8">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-3xl font-semibold">Horario general</span>
          <span className="text-2xl font-normal">Lista de clases</span>
        </div>
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-gray-400">Cargando horarios...</span>
        </div>
        <a className="text-sm font-normal underline">Ver horario completo</a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-4 row-span-2 bg-linear-to-b from-gray-100 to-gray-200 rounded-4xl flex flex-col gap-4 items-center p-8">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-3xl font-semibold">Horario general</span>
          <span className="text-2xl font-normal">Lista de clases</span>
        </div>
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
        <a className="text-sm font-normal underline">Ver horario completo</a>
      </div>
    );
  }

  return (
    <div className="col-span-4 row-span-2 bg-linear-to-b from-gray-100 to-gray-200 rounded-4xl flex flex-col gap-4 items-center p-8">
      <div className="flex flex-col gap-2 items-center">
        <span className="text-3xl font-semibold">Horario general</span>
        <span className="text-2xl font-normal">Lista de clases</span>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        <div className="bg-white/70 rounded-4xl flex flex-col gap-3 items-center p-8">
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
          <ClaseList clases={siguiente} emptyMessage="No hay más clases hoy" />
        </div>
      </div>
      <a className="text-sm font-normal underline">Ver horario completo</a>
    </div>
  );
}
