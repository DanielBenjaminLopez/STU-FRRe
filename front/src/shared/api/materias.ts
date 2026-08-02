import { apiFetch } from "./client";

export interface Materia {
  id: number;
  nombre: string;
}

export async function fetchMaterias(): Promise<Materia[]> {
  return apiFetch<Materia[]>("/api/materias/");
}

export async function createMateria(
  data: Omit<Materia, "id">,
): Promise<Materia> {
  return apiFetch<Materia>("/api/materias/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMateria(
  id: number,
  data: Partial<Materia>,
): Promise<Materia> {
  return apiFetch<Materia>(`/api/materias/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMateria(id: number): Promise<void> {
  await apiFetch(`/api/materias/${id}/`, { method: "DELETE" });
}
