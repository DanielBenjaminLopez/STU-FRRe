import { apiFetch, apiUpload } from "./client";
import type { Espacio } from "./totems";
import type { Materia } from "./materias";
import type { CsvImportResult } from "./horariosAdmin";

export interface MesaExamen {
  id: number;
  plan_materia?: number;
  materia?: number;
  espacio: number;
  fecha?: string;
  hora?: string;
  fecha_hora?: string;
  turno: string;
  llamado?: number;
  activo: boolean;
  materia_nombre?: string;
  espacio_nombre?: string;
}

export const TURNOS = [
  { value: "febrero", label: "Febrero" },
  { value: "marzo", label: "Marzo" },
  { value: "abril", label: "Abril" },
  { value: "junio", label: "Junio" },
  { value: "agosto", label: "Agosto" },
  { value: "septiembre", label: "Septiembre" },
  { value: "octubre", label: "Octubre" },
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

export interface PlanMateriaDTO {
  id: number;
  carrera: number;
  carrera_nombre?: string;
  materia_nombre?: string;
}

export async function fetchPlanMaterias(): Promise<PlanMateriaDTO[]> {
  return apiFetch<PlanMateriaDTO[]>("/api/plan-materias/");
}

export async function fetchMateriasForSelect(): Promise<Materia[]> {
  const list = await fetchPlanMaterias();
  return list.map((pm) => ({
    id: pm.id,
    nombre: pm.carrera_nombre
      ? `${pm.materia_nombre} (${pm.carrera_nombre})`
      : pm.materia_nombre || `Materia #${pm.id}`,
  }));
}

export async function fetchEspaciosForSelect(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}

export async function importarMesasExamenCSV(
  file: File,
): Promise<CsvImportResult> {
  return apiUpload<CsvImportResult>("/api/mesas-examen/importar-csv/", file);
}
