import { apiFetch } from "./client";

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
  activo: boolean;
  config_pantalla: Record<string, unknown>;
  vinculado: boolean;
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
  espacio_id: number;
}): Promise<Totem> {
  return apiFetch<Totem>("/api/totems/vincular/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchEspacios(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}
