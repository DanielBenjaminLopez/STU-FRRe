import { apiFetch, publicFetch } from "../../../shared/api/client";
import { API_ENDPOINTS } from "../../../shared/api/endpoints";

export interface UbicacionMapa {
  id: number;
  svg_id: string;
  nombre: string;
  tipo: string;
  tipo_display: string;
  piso: string;
  piso_display: string;
}

export type PisoKey = "baja" | "primero" | "segundo";

/** Devuelve todas las ubicaciones, opcionalmente filtradas por piso */
export async function fetchUbicacionesMapa(
  piso?: PisoKey,
): Promise<UbicacionMapa[]> {
  const params = piso ? `?piso=${piso}` : "";
  return publicFetch<UbicacionMapa[]>(
    `${API_ENDPOINTS.ubicacionesMapa}${params}`,
  );
}

/** Devuelve un diccionario svg_id → UbicacionMapa para un piso dado */
export async function fetchUbicacionesMapaByPiso(
  piso: PisoKey,
): Promise<Record<string, UbicacionMapa>> {
  const lista = await fetchUbicacionesMapa(piso);
  return Object.fromEntries(lista.map((u) => [u.svg_id, u]));
}

/** Edita nombre y/o tipo de una ubicación (solo admin autenticado) */
export async function updateUbicacionMapa(
  id: number,
  data: { nombre?: string; tipo?: string },
): Promise<UbicacionMapa> {
  return apiFetch<UbicacionMapa>(`/api/ubicaciones-mapa/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
