import { apiFetch } from "./client";

export interface Carrera {
  id: number;
  nombre: string;
}

export async function fetchCarreras(): Promise<Carrera[]> {
  return apiFetch<Carrera[]>("/api/carreras/");
}

export async function createCarrera(
  data: Omit<Carrera, "id">,
): Promise<Carrera> {
  return apiFetch<Carrera>("/api/carreras/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCarrera(
  id: number,
  data: Partial<Carrera>,
): Promise<Carrera> {
  return apiFetch<Carrera>(`/api/carreras/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCarrera(id: number): Promise<void> {
  await apiFetch(`/api/carreras/${id}/`, { method: "DELETE" });
}
