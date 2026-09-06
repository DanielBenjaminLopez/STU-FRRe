import { apiFetch, publicFetch } from "./client";
import { fetchEventos, type Evento } from "./eventos";

export interface Noticia {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  fecha_expiracion: string | null;
  imagen_url: string;
  enlace: string;
  origen: "manual" | "scraping";
}

export interface ContenidoFeed {
  id: number;
  titulo: string;
  contenido: string;
  fecha: string;
  fecha_expiracion?: string | null;
  imagen_url: string;
  tipo: "noticia" | "evento";
  tipo_evento?: string;
  espacio_nombre?: string;
  origen?: string;
  enlace?: string;
}

function mapNoticiaToFeed(n: Noticia): ContenidoFeed {
  return {
    id: n.id,
    titulo: n.titulo,
    contenido: n.contenido,
    fecha: n.fecha_publicacion,
    fecha_expiracion: n.fecha_expiracion,
    imagen_url: n.imagen_url,
    tipo: "noticia",
    origen: n.origen,
    enlace: n.enlace,
  };
}

function mapEventoToFeed(e: Evento): ContenidoFeed {
  const tipoLabel = e.tipo === "otro" && e.tipo_otro ? e.tipo_otro : e.tipo;
  return {
    id: e.id,
    titulo: e.titulo,
    contenido: e.descripcion || "",
    fecha: e.fecha_hora_inicio,
    imagen_url: e.imagen_url || "",
    tipo: "evento",
    tipo_evento: tipoLabel,
    espacio_nombre: e.espacio_nombre || undefined,
  };
}

export async function fetchFeed(): Promise<ContenidoFeed[]> {
  const [noticias, eventos] = await Promise.all([
    fetchNoticias(),
    fetchEventos(),
  ]);
  const feed = [
    ...noticias.map(mapNoticiaToFeed),
    ...eventos.map(mapEventoToFeed),
  ];
  feed.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
  return feed;
}

export async function fetchNoticias(): Promise<Noticia[]> {
  return publicFetch<Noticia[]>("/api/noticias/");
}

export async function fetchLatestNoticia(): Promise<Noticia | null> {
  return publicFetch<Noticia | null>("/api/noticias/latest/");
}

export async function createNoticia(
  data: Omit<Noticia, "id">,
): Promise<Noticia> {
  return apiFetch<Noticia>("/api/noticias/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNoticia(
  id: number,
  data: Partial<Noticia>,
): Promise<Noticia> {
  return apiFetch<Noticia>(`/api/noticias/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteNoticia(id: number): Promise<void> {
  await apiFetch(`/api/noticias/${id}/`, { method: "DELETE" });
}

export interface SyncResult {
  detail: string;
  nuevas: number;
  actualizadas: number;
  total: number;
}

export async function syncNoticias(): Promise<SyncResult> {
  return apiFetch<SyncResult>("/api/noticias/sync/", {
    method: "POST",
  });
}

export {
  createEvento,
  updateEvento,
  deleteEvento,
  uploadEventoImagen,
  fetchEspaciosForSelect,
  TIPOS_EVENTO,
} from "./eventos";
export type { Evento } from "./eventos";
