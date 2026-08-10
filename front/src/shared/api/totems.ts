import { apiFetch, totemFetch } from "./client";
import type { PlantillaDTO } from "./plantillas";

export interface Espacio {
  id: number;
  nombre: string;
  tipo: string;
  piso: number;
}

export interface Totem {
  id: number;
  nombre: string;
  espacio_id: number | null;
  espacio_nombre: string | null;
  activo: boolean;
  config_pantalla: Record<string, unknown>;
  vinculado: boolean;
  plantilla_id: number | null;
  plantilla: PlantillaDTO | null;
  creado_en: string;
}

export interface CreateTotemResponse {
  codigo_vinculacion: string;
}

export async function createTotem(): Promise<CreateTotemResponse> {
  return apiFetch<CreateTotemResponse>("/api/totems/new/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function vincularTotem(data: {
  codigo_vinculacion: string;
  nombre: string;
  espacio_id?: number;
}): Promise<Totem> {
  return apiFetch<Totem>("/api/totems/vincular/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchTotems(): Promise<Totem[]> {
  return apiFetch<Totem[]>("/api/totems/");
}

export async function updateTotem(
  id: number,
  data: Partial<Totem>,
): Promise<Totem> {
  return apiFetch<Totem>(`/api/totems/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTotem(id: number): Promise<void> {
  await apiFetch(`/api/totems/${id}/`, { method: "DELETE" });
}

export async function fetchEspacios(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}

export async function fetchTotemMe(): Promise<Totem> {
  return totemFetch<Totem>("/api/totems/me/");
}
