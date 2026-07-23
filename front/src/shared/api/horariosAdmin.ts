import { apiFetch } from "./client";
import type { Espacio } from "./totems";
import type { Materia } from "./materias";

export interface HorarioCursado {
  id: number;
  materia: number;
  espacio: number;
  dia_semana: string;
  comision: string;
  hora_inicio: string;
  hora_fin: string;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  activo: boolean;
}

export interface HorarioCursadoConNombres extends HorarioCursado {
  materia_nombre?: string;
  espacio_nombre?: string;
}

export const DIAS_SEMANA = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
] as const;

export async function fetchHorarios(): Promise<HorarioCursado[]> {
  return apiFetch<HorarioCursado[]>("/api/horarios/");
}

export async function createHorario(
  data: Omit<HorarioCursado, "id">,
): Promise<HorarioCursado> {
  return apiFetch<HorarioCursado>("/api/horarios/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHorario(
  id: number,
  data: Partial<HorarioCursado>,
): Promise<HorarioCursado> {
  return apiFetch<HorarioCursado>(`/api/horarios/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteHorario(id: number): Promise<void> {
  await apiFetch(`/api/horarios/${id}/`, { method: "DELETE" });
}

export async function fetchMateriasForSelect(): Promise<Materia[]> {
  return apiFetch<Materia[]>("/api/materias/");
}

export async function fetchEspaciosForSelect(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}
