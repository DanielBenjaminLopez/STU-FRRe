import { apiFetch, apiUpload } from "./client";
import type { Espacio } from "./totems";

export interface PlanMateria {
  id: number;
  carrera: number;
  materia: number;
  carrera_nombre: string;
  materia_nombre: string;
  carrera_tipo: "grado" | "tecnica" | "posgrado" | "diplomatura";
  nivel: string;
  modalidad: string;
  cuatrimestre: string | null;
  plan_estudio: string;
}

export interface Comision {
  id: number;
  plan_materia: number;
  nombre: string;
  display_name: string;
  materia_nombre?: string;
  carrera_nombre?: string;
  nivel?: string;
  modalidad?: string;
}

export interface HorarioCursado {
  id: number;
  comision: number | null;
  espacio: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
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

export const NIVELES = [
  { value: "primero", label: "1ro" },
  { value: "segundo", label: "2do" },
  { value: "tercero", label: "3ro" },
  { value: "cuarto", label: "4to" },
  { value: "quinto", label: "5to" },
] as const;

export const MODALIDADES = [
  { value: "anual", label: "Anual" },
  { value: "cuatrimestral", label: "Cuatrimestral" },
] as const;

export const PLANES = [
  { value: "2023", label: "2023" },
  { value: "2008", label: "2008" },
] as const;

export async function fetchPlanMaterias(filters?: {
  tipo?: string;
  carrera?: number;
  nivel?: string;
  modalidad?: string;
}): Promise<PlanMateria[]> {
  const params = new URLSearchParams();
  if (filters?.tipo) params.append("tipo", filters.tipo);
  if (filters?.carrera) params.append("carrera", String(filters.carrera));
  if (filters?.nivel) params.append("nivel", filters.nivel);
  if (filters?.modalidad) params.append("modalidad", filters.modalidad);
  const qs = params.toString();
  return apiFetch<PlanMateria[]>(`/api/plan-materias/${qs ? `?${qs}` : ""}`);
}

export async function createPlanMateria(
  data: Omit<PlanMateria, "id" | "carrera_nombre" | "materia_nombre">,
): Promise<PlanMateria> {
  return apiFetch<PlanMateria>("/api/plan-materias/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePlanMateria(
  id: number,
  data: Partial<PlanMateria>,
): Promise<PlanMateria> {
  return apiFetch<PlanMateria>(`/api/plan-materias/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePlanMateria(id: number): Promise<void> {
  await apiFetch(`/api/plan-materias/${id}/`, { method: "DELETE" });
}

export async function fetchComisiones(filters?: {
  plan_materia?: number;
}): Promise<Comision[]> {
  const params = new URLSearchParams();
  if (filters?.plan_materia)
    params.append("plan_materia", String(filters.plan_materia));
  const qs = params.toString();
  return apiFetch<Comision[]>(`/api/comisiones/${qs ? `?${qs}` : ""}`);
}

export async function createComision(
  data: Omit<
    Comision,
    | "id"
    | "display_name"
    | "materia_nombre"
    | "carrera_nombre"
    | "nivel"
    | "modalidad"
  >,
): Promise<Comision> {
  return apiFetch<Comision>("/api/comisiones/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateComision(
  id: number,
  data: Partial<Comision>,
): Promise<Comision> {
  return apiFetch<Comision>(`/api/comisiones/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteComision(id: number): Promise<void> {
  await apiFetch(`/api/comisiones/${id}/`, { method: "DELETE" });
}

export async function fetchHorarios(): Promise<HorarioCursadoConNombres[]> {
  return apiFetch<HorarioCursadoConNombres[]>("/api/horarios/");
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

export async function fetchEspaciosForSelect(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}

export interface CsvImportDetailRow {
  fila: number;
  tipo: "new" | "update" | "skip" | "error" | string;
  datos: Record<string, string | number | boolean | null>;
  errores: string[];
}

export interface CsvImportResult {
  detail: string;
  creados?: number;
  actualizados?: number;
  total?: number;
  totales?: {
    creados: number;
    actualizados: number;
    omitidos: number;
    errores: number;
  };
  detalles?: CsvImportDetailRow[];
  errors?: string[];
}

export async function importarHorariosCSV(
  file: File,
): Promise<CsvImportResult> {
  return apiUpload<CsvImportResult>("/api/horarios/importar-csv/", file);
}
