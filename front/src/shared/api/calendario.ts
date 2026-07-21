// When backend endpoint is ready, import apiFetch and use it in fetchEventosCalendario:
// import { apiFetch } from "./client";

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
  fecha: string; // 'YYYY-MM-DD'
};

export type EventoCalendarioRango = EventoCalendarioBase & {
  formato: "rango";
  desde: string; // 'YYYY-MM-DD'
  hasta: string; // 'YYYY-MM-DD', inclusive
};

export type EventoCalendario = EventoCalendarioPuntual | EventoCalendarioRango;

function generateMockEventosCalendario(): EventoCalendario[] {
  return [
    {
      id: 1,
      titulo: "Inicio del 1er Cuatrimestre 2026",
      tipo: "inicio_cuatrimestre",
      formato: "puntual",
      fecha: "2026-03-02",
    },
    {
      id: 2,
      titulo: "Fin del 1er Cuatrimestre 2026",
      tipo: "fin_cuatrimestre",
      formato: "puntual",
      fecha: "2026-06-27",
    },
    {
      id: 3,
      titulo: "Inicio del 2do Cuatrimestre 2026",
      tipo: "inicio_cuatrimestre",
      formato: "puntual",
      fecha: "2026-08-03",
    },
    {
      id: 4,
      titulo: "Fin del 2do Cuatrimestre 2026",
      tipo: "fin_cuatrimestre",
      formato: "puntual",
      fecha: "2026-12-05",
    },
    {
      id: 5,
      titulo: "Mesas de exámenes - Julio 2026",
      tipo: "mesa_examen",
      formato: "rango",
      desde: "2026-07-06",
      hasta: "2026-07-24",
    },
    {
      id: 6,
      titulo: "Mesas de exámenes - Diciembre 2026",
      tipo: "mesa_examen",
      formato: "rango",
      desde: "2026-12-14",
      hasta: "2026-12-23",
    },
    {
      id: 7,
      titulo: "Mesas de exámenes - Febrero 2027",
      tipo: "mesa_examen",
      formato: "rango",
      desde: "2027-02-08",
      hasta: "2027-02-19",
    },
    {
      id: 8,
      titulo: "Receso invernal",
      tipo: "receso_invernal",
      formato: "rango",
      desde: "2026-07-27",
      hasta: "2026-07-31",
    },
    {
      id: 9,
      titulo: "Feriado - Día de la Memoria",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-03-24",
    },
    {
      id: 10,
      titulo: "Feriado - Día del Trabajador",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-05-01",
    },
    {
      id: 11,
      titulo: "Feriado - Revolución de Mayo",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-05-25",
    },
    {
      id: 12,
      titulo: "Feriado - Día de la Independencia",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-07-09",
    },
    {
      id: 13,
      titulo: "Feriado - Paso a la Inmortalidad del Gral. San Martín",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-08-17",
    },
    {
      id: 14,
      titulo: "Feriado - Día del Respeto a la Diversidad Cultural",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-10-12",
    },
    {
      id: 15,
      titulo: "Feriado - Día de la Soberanía Nacional",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-11-20",
    },
    {
      id: 16,
      titulo: "Jornada de Puertas Abiertas",
      tipo: "otro",
      formato: "puntual",
      fecha: "2026-04-15",
    },
    {
      id: 17,
      titulo: "Semana de la Ciencia y la Tecnología",
      tipo: "otro",
      formato: "rango",
      desde: "2026-09-14",
      hasta: "2026-09-18",
    },
    {
      id: 18,
      titulo: "Feriado - Inmaculada Concepción",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-12-08",
    },
    {
      id: 19,
      titulo: "Feriado - Navidad",
      tipo: "feriado",
      formato: "puntual",
      fecha: "2026-12-25",
    },
  ];
}

export async function fetchEventosCalendario(): Promise<EventoCalendario[]> {
  // TODO: Cambiar esto por una llamada a la API
  // 1. Uncomment the import at the top:
  //    import { apiFetch } from "./client";
  // 2. Replace the body with:
  //    return apiFetch<EventoCalendario[]>("/api/calendario/eventos/");

  return new Promise((resolve) => {
    setTimeout(() => resolve(generateMockEventosCalendario()), 400);
  });
}
