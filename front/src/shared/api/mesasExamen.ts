import { apiFetch, apiUpload } from "./client";
import type { Espacio } from "./totems";
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

export type TurnoMesa = (typeof TURNOS)[number]["value"];

/**
 * Determina automáticamente el turno de examen según la fecha seleccionada.
 * Acepta formatos YYYY-MM-DD, YYYY-MM-DDTHH:mm y DD/MM/YYYY.
 */
export function getTurnoFromFecha(fechaStr: string): TurnoMesa | null {
  if (!fechaStr) return null;
  const cleanDate = fechaStr.split("T")[0].trim();
  let month = 0;
  let day = 0;

  if (cleanDate.includes("-")) {
    const parts = cleanDate.split("-");
    if (parts.length >= 3) {
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  } else if (cleanDate.includes("/")) {
    const parts = cleanDate.split("/");
    if (parts.length >= 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    }
  }

  if (isNaN(month) || month < 1 || month > 12) return null;

  switch (month) {
    case 1:
    case 2:
      return "febrero";
    case 3:
      return "marzo";
    case 4:
      return "abril";
    case 5:
      return day <= 15 ? "abril" : "junio";
    case 6:
      return "junio";
    case 7:
      return day <= 15 ? "junio" : "agosto";
    case 8:
      return "agosto";
    case 9:
      return "septiembre";
    case 10:
      return "octubre";
    case 11:
    case 12:
      return "diciembre";
    default:
      return null;
  }
}

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

export async function fetchEspaciosForSelect(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}

export async function importarMesasExamenCSV(
  file: File,
): Promise<CsvImportResult> {
  return apiUpload<CsvImportResult>("/api/mesas-examen/importar-csv/", file);
}
