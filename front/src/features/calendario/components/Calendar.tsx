import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useCalendario } from "../hooks/useCalendario";
import CalendarFull from "./CalendarFull";
import { MesGrilla, LeyendaCalendario } from "./CalendarGrid";
import { CalendarSkeleton } from "../../../shared/components/ui/Skeleton";
import { useOnTotemReset } from "../../../shared/context/TotemResetContext";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DIAS_SEMANA_COMPLETOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export interface CalendarProps {
  colSpan?: number;
  rowSpan?: number;
}

/* ------------------------------------------------------------------ */
/* Widget card del calendario (vista compacta en el dashboard)         */
/* ------------------------------------------------------------------ */

export default function Calendar({ colSpan = 2, rowSpan = 2 }: CalendarProps) {
  const { eventos, loading, error } = useCalendario();
  const [showFull, setShowFull] = useState(false);
  useOnTotemReset(() => setShowFull(false));

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();
  const nombreDia = DIAS_SEMANA_COMPLETOS[ahora.getDay()];

  const is1x1 = colSpan === 1 && rowSpan === 1;
  const is2x1 = colSpan === 2 && rowSpan === 1;

  return (
    <>
      <AnimatePresence>
        {showFull && <CalendarFull onClose={() => setShowFull(false)} />}
      </AnimatePresence>

      {is1x1 ? (
        <div
          data-testid="calendario-widget"
          data-variant="1x1"
          className="w-full h-full col-span-1 row-span-1 bg-linear-to-br from-teal-300/50 to-teal-300/60 rounded-4xl flex flex-col justify-between items-center gap-3 p-6 overflow-hidden"
        >
          <div
            data-testid="calendario-hoy-card"
            className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-1 rounded-3xl bg-white/50 border border-gray-200 p-3 text-center overflow-hidden"
          >
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {nombreDia}
            </span>
            <span
              data-testid="calendario-dia-hoy"
              className="text-4xl font-bold text-slate-900 leading-none"
            >
              {dia}
            </span>
            <span className="text-sm font-normal text-slate-700">
              {MESES[mes]} {anio}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="w-full shrink-0 shadow-xs text-sm font-medium bg-white/50 hover:bg-white/70 active:bg-white/80 border border-gray-200 px-4 py-1 rounded-2xl cursor-pointer transition-all"
          >
            Abrir calendario
          </button>
        </div>
      ) : is2x1 ? (
        <div
          data-testid="calendario-widget"
          data-variant="2x1"
          className="w-full h-full col-span-2 row-span-1 bg-linear-to-br from-teal-300/50 to-teal-300/60 rounded-4xl flex flex-row gap-6 items-center p-6 overflow-hidden"
        >
          <div
            data-testid="calendario-header"
            className="flex flex-col items-center justify-center gap-4 flex-1 min-w-0 h-full text-center"
          >
            <span className="text-xl font-semibold">Calendario</span>
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="shadow-xs text-sm font-medium bg-white/50 hover:bg-white/70 active:bg-white/80 border border-gray-200 px-8 py-1 rounded-2xl cursor-pointer transition-all"
            >
              Abrir calendario
            </button>
          </div>

          <div
            data-testid="calendario-preview-container"
            className="flex flex-col items-center justify-center flex-1 min-w-0 h-full rounded-3xl bg-white/50 border border-gray-200 p-3 overflow-hidden"
          >
            {loading && <CalendarSkeleton />}

            {!loading && error && (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-red-400 text-xs text-center">
                  {error}
                </span>
              </div>
            )}

            {!loading && !error && (
              <div className="flex flex-col gap-1 items-center justify-center w-full h-full">
                <span className="text-xs font-semibold text-slate-800">
                  {MESES[mes]} {anio}
                </span>
                <MesGrilla anio={anio} mes={mes} eventos={eventos} compact />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          data-testid="calendario-widget"
          data-variant={`${colSpan}x${rowSpan}`}
          className="w-full h-full col-span-2 row-span-2 bg-linear-to-br from-teal-300/50 to-teal-300/60 rounded-4xl flex flex-col gap-4 items-center p-6 overflow-hidden"
        >
          <div
            data-testid="calendario-header"
            className="relative w-full flex flex-row gap-2 items-center"
          >
            <span className="text-xl font-semibold">Calendario</span>
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="shadow-xs absolute top-1/2 -translate-y-1/2 right-0 text-sm font-medium bg-white/50 hover:bg-white/70 active:bg-white/80 border border-gray-200 px-8 py-1 rounded-2xl cursor-pointer transition-all"
            >
              Abrir calendario
            </button>
          </div>

          {loading && <CalendarSkeleton />}

          {!loading && error && (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="w-full h-full flex flex-col justify-between items-center rounded-3xl bg-white/50 border border-gray-200 p-4">
              <div className="flex flex-col gap-2 items-center">
                <span className="text-base font-normal">
                  {MESES[mes]} {anio}
                </span>
                <MesGrilla anio={anio} mes={mes} eventos={eventos} />
              </div>
              <LeyendaCalendario
                eventos={eventos.filter((ev) => {
                  if (ev.formato === "puntual") {
                    const [, m] = ev.fecha.split("-").map(Number);
                    return m - 1 === mes;
                  }
                  const desde = new Date(ev.desde);
                  const hasta = new Date(ev.hasta);
                  const finMes = new Date(anio, mes + 1, 0);
                  return hasta >= new Date(anio, mes, 1) && desde <= finMes;
                })}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
