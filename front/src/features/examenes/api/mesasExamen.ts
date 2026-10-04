import { apiFetch, apiUpload } from "../../../shared/api/client";
import { API_ENDPOINTS } from "../../../shared/api/endpoints";
import type { CsvImportResult } from "../../horarios/api/horariosAdmin";

export interface MesaExamen {
  id: number;
  carrera?: number | null;
  carrera_codigo?: string;
  carrera_nombre?: string;
  materia: string;
  materia_nombre?: string;
  espacio: string;
  fecha?: string;
  hora?: string;
}

export async function fetchMesasExamen(): Promise<MesaExamen[]> {
  return apiFetch<MesaExamen[]>(API_ENDPOINTS.mesasExamen);
}

export async function createMesaExamen(
  data: Omit<MesaExamen, "id">,
): Promise<MesaExamen> {
  return apiFetch<MesaExamen>(API_ENDPOINTS.mesasExamen, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMesaExamen(
  id: number,
  data: Partial<MesaExamen>,
): Promise<MesaExamen> {
  return apiFetch<MesaExamen>(`${API_ENDPOINTS.mesasExamen}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMesaExamen(id: number): Promise<void> {
  await apiFetch(`${API_ENDPOINTS.mesasExamen}${id}/`, { method: "DELETE" });
}

export async function vaciarMesasExamen(filters?: {
  carrera?: number;
}): Promise<{ eliminados: number }> {
  const params = new URLSearchParams();
  if (filters?.carrera) params.append("carrera", String(filters.carrera));
  const qs = params.toString();
  return apiFetch<{ eliminados: number }>(
    `${API_ENDPOINTS.mesasExamen}vaciar/${qs ? `?${qs}` : ""}`,
    {
      method: "DELETE",
    },
  );
}

export async function importarMesasExamenCSV(
  file: File,
): Promise<CsvImportResult> {
  return apiUpload<CsvImportResult>("/api/mesas-examen/importar-csv/", file);
}
