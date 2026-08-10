import { apiFetch } from "./client";

export interface EventoCalendarioAdmin {
  id: number;
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_rango: boolean;
  todo_el_dia: boolean;
  color: string;
  descripcion: string;
  documento_fuente: string | null;
  documento_fuente_url: string | null;
  creado_en: string;
  actualizado_en: string;
}

export const TIPOS_EVENTO_CALENDARIO = [
  { value: "inicio_cuatrimestre", label: "Inicio de Cuatrimestre" },
  { value: "fin_cuatrimestre", label: "Fin de Cuatrimestre" },
  { value: "mesa_examen", label: "Mesa de Examen" },
  { value: "receso_invernal", label: "Receso Invernal" },
  { value: "feriado", label: "Feriado" },
] as const;

export async function fetchEventosCalendario(): Promise<
  EventoCalendarioAdmin[]
> {
  return apiFetch<EventoCalendarioAdmin[]>("/api/calendario/eventos/");
}

export interface BulkEventData {
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  todo_el_dia: boolean;
  color: string;
  descripcion: string;
}

export async function bulkSaveCalendario(
  eventos: BulkEventData[],
  year: number,
): Promise<{ guardados: number; ids: number[] }> {
  return apiFetch<{ guardados: number; ids: number[] }>(
    "/api/calendario/bulk/",
    {
      method: "POST",
      body: JSON.stringify({ eventos, year }),
    },
  );
}
