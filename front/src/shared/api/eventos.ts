import { apiFetch } from "./client";
import type { Espacio } from "./totems";

export interface Evento {
  id: number;
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  espacio: number | null;
}

export const TIPOS_EVENTO = [
  { value: "taller", label: "Taller" },
  { value: "curso", label: "Curso" },
  { value: "evento", label: "Evento" },
  { value: "charla", label: "Charla" },
] as const;

export async function fetchEventos(): Promise<Evento[]> {
  return apiFetch<Evento[]>("/api/eventos/");
}

export async function createEvento(
  data: Omit<Evento, "id">,
): Promise<Evento> {
  return apiFetch<Evento>("/api/eventos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvento(
  id: number,
  data: Partial<Evento>,
): Promise<Evento> {
  return apiFetch<Evento>(`/api/eventos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEvento(id: number): Promise<void> {
  await apiFetch(`/api/eventos/${id}/`, { method: "DELETE" });
}

export async function fetchEspaciosForSelect(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}
