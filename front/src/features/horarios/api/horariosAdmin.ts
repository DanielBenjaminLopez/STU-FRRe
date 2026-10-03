import { apiFetch, apiUpload } from "../../../shared/api/client";
import { API_ENDPOINTS } from "../../../shared/api/endpoints";

export interface Materia {
  id: number;
  nombre: string;
  carrera: number;
  carrera_nombre: string;
  carrera_codigo?: string;
  carrera_tipo: "grado" | "tecnica" | "posgrado" | "diplomatura";
  nivel: string;
}

export interface HorarioCursado {
  id: number;
  materia: number;
  comision: string;
  espacio: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface HorarioCursadoConNombres extends HorarioCursado {
  materia_nombre?: string;
  carrera_codigo?: string;
  carrera_nombre?: string;
  nivel?: string;
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

export async function fetchMaterias(filters?: {
  tipo?: string;
  carrera?: number;
  nivel?: string;
}): Promise<Materia[]> {
  const params = new URLSearchParams();
  if (filters?.tipo) params.append("tipo", filters.tipo);
  if (filters?.carrera) params.append("carrera", String(filters.carrera));
  if (filters?.nivel) params.append("nivel", filters.nivel);
  const qs = params.toString();
  return apiFetch<Materia[]>(`${API_ENDPOINTS.materias}${qs ? `?${qs}` : ""}`);
}

export async function fetchHorarios(): Promise<HorarioCursadoConNombres[]> {
  return apiFetch<HorarioCursadoConNombres[]>(API_ENDPOINTS.horarios);
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

export async function vaciarHorarios(filters?: {
  carrera?: number;
  nivel?: string;
  comision?: string;
  dia_semana?: string;
}): Promise<{ eliminados: number }> {
  const params = new URLSearchParams();
  if (filters?.carrera) params.append("carrera", String(filters.carrera));
  if (filters?.nivel) params.append("nivel", filters.nivel);
  if (filters?.comision) params.append("comision", filters.comision);
  if (filters?.dia_semana) params.append("dia_semana", filters.dia_semana);
  const qs = params.toString();
  return apiFetch<{ eliminados: number }>(
    `/api/horarios/vaciar/${qs ? `?${qs}` : ""}`,
    {
      method: "DELETE",
    },
  );
}

export interface CsvImportDetailRow {
  fila: number;
  tipo: "new" | "update" | "skip" | "error" | string;
  datos: Record<string, string | number | boolean | null>;
  errores: string[];
}

export interface CsvImportResult {
  detail: string;
  /** El backend responde 200 aunque la importacion falle por errores de fila. */
  exito?: boolean;
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
