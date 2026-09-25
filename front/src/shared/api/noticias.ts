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
  destacado?: boolean;
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

const TIPO_EVENTO_MAP: Record<string, string> = {
  taller: "Taller",
  curso: "Curso",
  recreativo: "Recreativo",
  charla: "Charla",
  otro: "Otro",
};

function formatTipoEvento(raw?: string): string {
  if (!raw) return "Evento";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (TIPO_EVENTO_MAP[lower]) return TIPO_EVENTO_MAP[lower];
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function mapEventoToFeed(e: Evento): ContenidoFeed {
  const rawTipo = e.tipo === "otro" && e.tipo_otro ? e.tipo_otro : e.tipo;
  const tipoLabel = formatTipoEvento(rawTipo);
  return {
    id: e.id,
    titulo: e.titulo,
    contenido: e.descripcion || "",
    fecha: e.fecha_hora_inicio,
    imagen_url: e.imagen_url || "",
    tipo: "evento",
    tipo_evento: tipoLabel,
    espacio_nombre: e.espacio_nombre || undefined,
    destacado: Boolean(e.destacado),
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

export async function fetchFeedScraping(): Promise<ContenidoFeed[]> {
  const noticias = await fetchNoticias();
  const feed = noticias
    .filter((n) => n.origen === "scraping")
    .map(mapNoticiaToFeed);
  feed.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
  return feed;
}

export async function fetchFeedCreados(): Promise<ContenidoFeed[]> {
  const [noticias, eventos] = await Promise.all([
    fetchNoticias(),
    fetchEventos(),
  ]);
  const feed = [
    ...noticias.filter((n) => n.origen === "manual").map(mapNoticiaToFeed),
    ...eventos.map(mapEventoToFeed),
  ];

  // Si hay algún evento destacado, el widget debe mostrar ÚNICAMENTE ese evento
  const eventoDestacado = feed.find((item) => item.destacado);
  if (eventoDestacado) {
    return [eventoDestacado];
  }

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
