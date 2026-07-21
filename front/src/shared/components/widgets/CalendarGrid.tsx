import { useEffect, useState } from "react";
import type {
  EventoCalendario,
  TipoEventoCalendario,
} from "../../api/calendario";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type ColorEvento = "verde" | "rojo" | "amarillo" | "azul" | "violeta";

type Posicion = "unica" | "inicio" | "medio" | "fin";

type EventoIndexado = EventoCalendario & {
  posicion: Posicion;
  color: ColorEvento;
};

type Celda = { dia: number; fueraDeMes: boolean };

export interface CalendarGridProps {
  title: string;
  eventos: EventoCalendario[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  loadingText?: string;
}

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

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
/* Mapeo tipo → color                                                  */
/* ------------------------------------------------------------------ */

const COLOR_POR_TIPO: Record<TipoEventoCalendario, ColorEvento> = {
  inicio_cuatrimestre: "verde",
  fin_cuatrimestre: "verde",
  mesa_examen: "violeta",
  receso_invernal: "azul",
  feriado: "rojo",
  otro: "amarillo",
};

const CLASES_COLOR: Record<ColorEvento, string> = {
  verde: "bg-emerald-200 text-emerald-900",
  rojo: "bg-red-400 text-white font-bold",
  amarillo: "bg-amber-300 text-amber-900",
  azul: "bg-sky-300 text-sky-900",
  violeta: "bg-violet-300 text-violet-900",
};

const DOT_COLORS: Record<ColorEvento, string> = {
  verde: "bg-emerald-400",
  rojo: "bg-red-400",
  amarillo: "bg-amber-400",
  azul: "bg-sky-400",
  violeta: "bg-violet-400",
};

type EntradaLeyenda = { label: string; color: ColorEvento };

const GRUPOS_LEYENDA: Record<TipoEventoCalendario, EntradaLeyenda> = {
  inicio_cuatrimestre: { label: "Cuatrimestre", color: "verde" },
  fin_cuatrimestre: { label: "Cuatrimestre", color: "verde" },
  mesa_examen: { label: "Mesas de exámenes", color: "violeta" },
  receso_invernal: { label: "Receso invernal", color: "azul" },
  feriado: { label: "Feriado", color: "rojo" },
  otro: { label: "Otro", color: "amarillo" },
};

/* ------------------------------------------------------------------ */
/* Utilidades de fecha                                                 */
/* ------------------------------------------------------------------ */

function construirGrilla(anio: number, mes: number): Celda[][] {
  const primerDiaMes = new Date(anio, mes, 1);
  const offset = (primerDiaMes.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(anio, mes, 0).getDate();

  const celdas: Celda[] = [];
  for (let i = offset - 1; i >= 0; i--) {
    celdas.push({ dia: diasMesAnterior - i, fueraDeMes: true });
  }
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push({ dia: d, fueraDeMes: false });
  }
  while (celdas.length % 7 !== 0) {
    celdas.push({ dia: 0, fueraDeMes: true });
  }

  const semanas: Celda[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }
  return semanas;
}

function indexarEventos(
  anio: number,
  mes: number,
  eventos: EventoCalendario[],
): Map<number, EventoIndexado> {
  const porFecha = new Map<number, EventoIndexado>();

  for (const ev of eventos) {
    const color = COLOR_POR_TIPO[ev.tipo];

    if (ev.formato === "puntual") {
      const [y, m, d] = ev.fecha.split("-").map(Number);
      if (y !== anio || m - 1 !== mes) continue;
      porFecha.set(d, { ...ev, color, posicion: "unica" });
    } else {
      const desde = new Date(ev.desde);
      const hasta = new Date(ev.hasta);
      const cursor = new Date(desde);
      while (cursor <= hasta) {
        if (cursor.getFullYear() === anio && cursor.getMonth() === mes) {
          const dia = cursor.getDate();
          let posicion: Posicion = "medio";
          if (cursor.getTime() === desde.getTime()) posicion = "inicio";
          if (cursor.getTime() === hasta.getTime()) posicion = "fin";
          if (desde.getTime() === hasta.getTime()) posicion = "unica";
          porFecha.set(dia, { ...ev, color, posicion });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }
  return porFecha;
}

function clasesRedondeo(
  evento: EventoIndexado | undefined,
  compacto: boolean,
): string {
  if (!evento) return "rounded-full";
  if (evento.formato === "puntual" || evento.posicion === "unica")
    return "rounded-full";
  if (evento.posicion === "inicio")
    return compacto ? "rounded-l-full" : "rounded-l-full pl-1";
  if (evento.posicion === "fin")
    return compacto ? "rounded-r-full" : "rounded-r-full pr-1";
  return "rounded-none";
}

/* ------------------------------------------------------------------ */
/* Sub-componentes (exportados para uso en Calendar widget)            */
/* ------------------------------------------------------------------ */

export function LeyendaCalendario({
  eventos,
}: {
  eventos?: EventoCalendario[];
} = {}) {
  const entradas: EntradaLeyenda[] = [];

  if (eventos) {
    const tiposPresentes = new Set<TipoEventoCalendario>();
    for (const ev of eventos) {
      tiposPresentes.add(ev.tipo);
    }
    for (const tipo of tiposPresentes) {
      const entrada = GRUPOS_LEYENDA[tipo];
      if (!entradas.some((e) => e.label === entrada.label)) {
        entradas.push(entrada);
      }
    }
  } else {
    const vistas = new Set<string>();
    for (const entrada of Object.values(GRUPOS_LEYENDA)) {
      if (!vistas.has(entrada.label)) {
        vistas.add(entrada.label);
        entradas.push(entrada);
      }
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
      {entradas.map((entrada) => (
        <div
          key={entrada.label}
          className="flex items-center gap-1.5 text-sm text-slate-700"
        >
          <span
            className={`inline-block h-3 w-3 rounded-full ${DOT_COLORS[entrada.color]}`}
          />
          <span>{entrada.label}</span>
        </div>
      ))}
    </div>
  );
}

export function MesGrilla({
  anio,
  mes,
  eventos,
  compacto = false,
  onSeleccionarDia,
  onSeleccionarEvento,
}: {
  anio: number;
  mes: number;
  eventos: EventoCalendario[];
  compacto?: boolean;
  onSeleccionarDia?: (fecha: Date) => void;
  onSeleccionarEvento?: (evento: EventoCalendario) => void;
}) {
  const semanas = construirGrilla(anio, mes);
  const eventosPorDia = indexarEventos(anio, mes, eventos);
  const hoy = new Date();
  const esMesActual = hoy.getFullYear() === anio && hoy.getMonth() === mes;

  const altoCelda = compacto ? "h-5 text-[10px]" : "h-10 text-[17px]";

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className={`text-center font-semibold text-slate-500 ${compacto ? "text-[10px] py-0.5" : "text-sm py-1.5"}`}
          >
            {compacto ? d[0] : d}
          </div>
        ))}
      </div>

      {semanas.map((semana, i) => (
        <div key={i} className="grid grid-cols-7">
          {semana.map((celda, j) => {
            const evento = !celda.fueraDeMes
              ? eventosPorDia.get(celda.dia)
              : undefined;
            const esHoy =
              esMesActual && !celda.fueraDeMes && celda.dia === hoy.getDate();

            return (
              <div key={j} className={compacto ? "py-px" : "py-0.5"}>
                <div
                  title={evento?.titulo}
                  onClick={
                    !celda.fueraDeMes && evento && onSeleccionarEvento
                      ? (e) => {
                          e.stopPropagation();
                          onSeleccionarEvento(evento);
                        }
                      : !celda.fueraDeMes && onSeleccionarDia
                        ? () => onSeleccionarDia(new Date(anio, mes, celda.dia))
                        : undefined
                  }
                  className={[
                    "flex items-center justify-center font-medium mx-auto",
                    altoCelda,
                    celda.fueraDeMes ? "text-slate-300" : "text-slate-900",
                    evento ? CLASES_COLOR[evento.color] : "",
                    evento
                      ? evento.formato === "rango"
                        ? "w-full"
                        : compacto
                          ? "w-5"
                          : "w-10"
                      : "",
                    !evento && esHoy
                      ? `${compacto ? "w-5" : "w-10"} rounded-full ring-1 ring-slate-800`
                      : "",
                    evento ? clasesRedondeo(evento, compacto) : "",
                    (onSeleccionarDia || onSeleccionarEvento) &&
                    !celda.fueraDeMes
                      ? "cursor-pointer"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {celda.fueraDeMes ? "" : celda.dia}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal: CalendarGrid (fullscreen overlay)             */
/* ------------------------------------------------------------------ */

export default function CalendarGrid({
  title,
  eventos,
  loading,
  error,
  onClose,
  loadingText = "Cargando...",
}: CalendarGridProps) {
  const [anio] = useState(() => new Date().getFullYear());
  const [eventoSeleccionado, setEventoSeleccionado] =
    useState<EventoCalendario | null>(null);

  useEffect(() => {
    if (!eventoSeleccionado) return;
    function cerrar(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-popover-evento]")) {
        setEventoSeleccionado(null);
      }
    }
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [eventoSeleccionado]);

  const eventosAnio = eventos.filter((ev) => {
    if (ev.formato === "puntual") {
      const y = Number(ev.fecha.split("-")[0]);
      return y === anio;
    }
    const desde = new Date(ev.desde);
    const hasta = new Date(ev.hasta);
    return hasta.getFullYear() >= anio && desde.getFullYear() <= anio;
  });

  const subtitulo = `Ciclo lectivo ${anio}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white w-full h-full overflow-hidden rounded-4xl">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 min-w-48 text-center">
              {subtitulo}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="text-sm font-normal underline text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">{loadingText}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col items-center gap-6">
              <div className="grid w-full gap-4 grid-cols-3 grid-rows-4">
                {MESES.map((nombreMes, m) => {
                  const seleccionDelMes =
                    eventoSeleccionado &&
                    eventoSeleccionado.formato === "puntual"
                      ? (() => {
                          const [, em] = eventoSeleccionado.fecha
                            .split("-")
                            .map(Number);
                          return em - 1 === m ? eventoSeleccionado : null;
                        })()
                      : eventoSeleccionado &&
                          eventoSeleccionado.formato === "rango"
                        ? (() => {
                            const desde = new Date(eventoSeleccionado.desde);
                            const hasta = new Date(eventoSeleccionado.hasta);
                            const finMes = new Date(anio, m + 1, 0);
                            return hasta >= new Date(anio, m, 1) &&
                              desde <= finMes
                              ? eventoSeleccionado
                              : null;
                          })()
                        : null;

                  return (
                    <div key={nombreMes} className="relative w-full h-full">
                      <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 px-2.5 py-3 text-center flex flex-col w-full h-full">
                        <div className="mb-1.5 text-base font-bold text-slate-900">
                          {nombreMes}
                        </div>
                        <MesGrilla
                          anio={anio}
                          mes={m}
                          eventos={eventos}
                          onSeleccionarEvento={setEventoSeleccionado}
                        />
                      </div>

                      {seleccionDelMes && (
                        <div
                          data-popover-evento
                          className="absolute top-full left-0 z-10 mt-1 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900 text-wrap wrap-break-word">
                              {seleccionDelMes.titulo}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEventoSeleccionado(null)}
                              className="ml-2 shrink-0 text-gray-400 hover:text-gray-600"
                            >
                              x
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_COLORS[COLOR_POR_TIPO[seleccionDelMes.tipo]]}`}
                            />
                            <span className="text-xs text-slate-600">
                              {GRUPOS_LEYENDA[seleccionDelMes.tipo].label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {seleccionDelMes.formato === "puntual"
                              ? new Date(
                                  seleccionDelMes.fecha + "T00:00:00",
                                ).toLocaleDateString("es-AR")
                              : `${new Date(seleccionDelMes.desde + "T00:00:00").toLocaleDateString("es-AR")} — ${new Date(seleccionDelMes.hasta + "T00:00:00").toLocaleDateString("es-AR")}`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <LeyendaCalendario eventos={eventosAnio} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
