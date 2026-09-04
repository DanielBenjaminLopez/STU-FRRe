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
  pin_mapa_piso: "baja" | "primero" | "segundo" | null;
  pin_mapa_svg_x: number | null;
  pin_mapa_svg_y: number | null;
  video_url: string | null;
  video_intervalo: number;
  video_activo: boolean;
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

export async function updateTotemPinMapa(
  id: number,
  pin: {
    pin_mapa_piso: string;
    pin_mapa_svg_x: number;
    pin_mapa_svg_y: number;
  } | null,
): Promise<Totem> {
  return apiFetch<Totem>(`/api/totems/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(
      pin
        ? {
            pin_mapa_piso: pin.pin_mapa_piso,
            pin_mapa_svg_x: pin.pin_mapa_svg_x,
            pin_mapa_svg_y: pin.pin_mapa_svg_y,
          }
        : { pin_mapa_piso: null, pin_mapa_svg_x: null, pin_mapa_svg_y: null },
    ),
  });
}

export async function fetchEspacios(): Promise<Espacio[]> {
  return apiFetch<Espacio[]>("/api/espacios/");
}

export async function fetchTotemMe(): Promise<Totem> {
  return totemFetch<Totem>("/api/totems/me/");
}

export interface ConfiguracionVideo {
  video_archivo: string | null;
  video_url: string | null;
  intervalo: number;
  activo: boolean;
}

export async function fetchConfigVideo(): Promise<ConfiguracionVideo> {
  return apiFetch<ConfiguracionVideo>("/api/config-video/");
}

export async function updateConfigVideo(
  data: Partial<ConfiguracionVideo>,
): Promise<ConfiguracionVideo> {
  return apiFetch<ConfiguracionVideo>("/api/config-video/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function uploadVideoArchivo(
  archivo: File,
): Promise<ConfiguracionVideo> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("video_archivo", archivo);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/config-video/", {
    method: "PATCH",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail =
      body?.video_archivo?.[0] || body?.detail || `Error ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail[0] : String(detail));
  }

  return response.json();
}
