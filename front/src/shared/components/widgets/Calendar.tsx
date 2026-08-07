import { useState } from "react";
import { useCalendario } from "../../hooks/useCalendario";
import CalendarFull from "./CalendarFull";
import { MesGrilla, LeyendaCalendario } from "./CalendarGrid";

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

/* ------------------------------------------------------------------ */
/* Widget card del calendario (vista compacta en el dashboard)         */
/* ------------------------------------------------------------------ */

export default function Calendar() {
  const { eventos, loading, error } = useCalendario();
  const [showFull, setShowFull] = useState(false);

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();

  return (
    <>
      {showFull && <CalendarFull onClose={() => setShowFull(false)} />}

      <div className="col-span-2 row-span-2 bg-linear-to-br from-teal-300/50 to-teal-300/60 rounded-4xl flex flex-col gap-4 items-center p-8 overflow-hidden">
        <div className="relative w-full flex flex-row gap-2 items-center">
          <span className="text-xl font-semibold">Calendario</span>
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="shadow-xs absolute top-1/2 -translate-y-1/2 right-0 text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
          >
            Abrir calendario
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-slate-600">Cargando eventos...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="w-full h-full flex flex-col justify-between items-center rounded-4xl bg-white/50 border border-gray-200 p-4">
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
    </>
  );
}
