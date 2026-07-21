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

      <div className="col-span-2 row-span-2 bg-linear-to-br from-teal-200 to-cyan-200 rounded-4xl flex flex-col gap-4 items-center p-8 overflow-hidden">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-3xl font-semibold">Calendario académico</span>
          <span className="text-2xl font-normal">
            {MESES[mes]} {anio}
          </span>
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
          <div className="w-full rounded-3xl bg-linear-to-br from-emerald-50 to-teal-50 px-5 pb-6 pt-5">
            <MesGrilla anio={anio} mes={mes} eventos={eventos} />
          </div>
        )}

        {!loading && !error && (
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
        )}

        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="text-sm font-normal underline"
        >
          Ver calendario completo
        </button>
      </div>
    </>
  );
}
