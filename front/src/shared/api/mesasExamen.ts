import { apiFetch } from "./client";
import type { Espacio } from "./totems";
import type { Materia } from "./materias";

export interface MesaExamen {
  id: number;
  materia: number;
  espacio: number;
  fecha_hora: string;
  turno: string;
  llamado: number;
  tribunal: string;
  activo: boolean;
  materia_nombre?: string;
  espacio_nombre?: string;
}

export const TURNOS = [
  { value: "febrero", label: "Febrero" },
  { value: "julio", label: "Julio" },
  { value: "diciembre", label: "Diciembre" },
] as const;

export async function fetchMesasExamen(): Promise<MesaExamen[]> {
  return apiFetch<MesaExamen[]>("/api/mesas-examen/");
}

export async function createMesaExamen(
  data: Omit<MesaExamen, "id">,
): Promise<MesaExamen> {
  return apiFetch<MesaExamen>("/api/mesas-examen/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMesaExamen(
  id: number,
  data: Partial<MesaExamen>,
): Promise<MesaExamen> {
  return apiFetch<MesaExamen>(`/api/mesas-examen/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMesaExamen(id: number): Promise<void> {
  await apiFetch(`/api/mesas-examen/${id}/`, { method: "DELETE" });
}

export async function fetchMateriasForSelect(): Promise<Materia[]> {
  return apiFetch<Materia[]>("/api/materias/");
}

export async function fetchEspaciosForSelect(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}
