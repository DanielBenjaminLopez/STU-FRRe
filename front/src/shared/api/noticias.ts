import { apiFetch } from "./client";

export interface Noticia {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  fecha_expiracion: string | null;
}

export async function fetchNoticias(): Promise<Noticia[]> {
  return apiFetch<Noticia[]>("/api/noticias/");
}

export async function fetchLatestNoticia(): Promise<Noticia | null> {
  return apiFetch<Noticia | null>("/api/noticias/latest/");
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
