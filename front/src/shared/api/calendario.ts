import { totemFetch } from "./client";

export type TipoEventoCalendario =
  | "inicio_cuatrimestre"
  | "fin_cuatrimestre"
  | "mesa_examen"
  | "receso_invernal"
  | "feriado"
  | "otro";

export type EventoCalendarioBase = {
  id: number;
  titulo: string;
  tipo: TipoEventoCalendario;
};

export type EventoCalendarioPuntual = EventoCalendarioBase & {
  formato: "puntual";
  fecha: string;
};

export type EventoCalendarioRango = EventoCalendarioBase & {
  formato: "rango";
  desde: string;
  hasta: string;
};

export type EventoCalendario = EventoCalendarioPuntual | EventoCalendarioRango;

interface EventoCalendarioBackend {
  id: number;
  titulo: string;
  tipo: TipoEventoCalendario;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_rango: boolean;
}

export async function fetchEventosCalendario(): Promise<EventoCalendario[]> {
  const data = await totemFetch<EventoCalendarioBackend[]>(
    "/api/calendario/eventos/",
  );

  return data.map((e) => {
    if (e.es_rango && e.fecha_fin) {
      return {
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        formato: "rango" as const,
        desde: e.fecha_inicio,
        hasta: e.fecha_fin,
      };
    }
    return {
      id: e.id,
      titulo: e.titulo,
      tipo: e.tipo,
      formato: "puntual" as const,
      fecha: e.fecha_inicio,
    };
  });
}
