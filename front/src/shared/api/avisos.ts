import { apiFetch, totemFetch } from "./client";

export interface Aviso {
  id: number;
  horario_cursado: number | null;
  actividad_extra: number | null;
  fecha: string;
  motivo: string;
  tipo: string;
}

export const TIPOS_AVISO = [
  { value: "paro", label: "Paro" },
  { value: "inasistencia", label: "Inasistencia" },
  { value: "feriado", label: "Feriado" },
] as const;

export async function fetchAvisos(): Promise<Aviso[]> {
  return apiFetch<Aviso[]>("/api/avisos/");
}

export async function fetchAvisosActivos(): Promise<Aviso[]> {
  return totemFetch<Aviso[]>("/api/avisos-activos/");
}

export async function createAviso(data: Omit<Aviso, "id">): Promise<Aviso> {
  return apiFetch<Aviso>("/api/avisos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAviso(
  id: number,
  data: Partial<Aviso>,
): Promise<Aviso> {
  return apiFetch<Aviso>(`/api/avisos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAviso(id: number): Promise<void> {
  await apiFetch(`/api/avisos/${id}/`, { method: "DELETE" });
}
