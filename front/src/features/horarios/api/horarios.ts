import { totemFetch } from "../../../shared/api/client";

export interface Clase {
  id: number;
  carrera_codigo: string;
  carrera_nombre: string;
  materia?: number;
  nivel: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
}

interface HorarioBackend {
  id: number;
  materia?: number;
  comision: string;
  espacio: string;
  materia_nombre: string;
  carrera_codigo: string;
  carrera_nombre?: string;
  nivel?: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

export async function fetchHorarios(): Promise<Clase[]> {
  const data = await totemFetch<HorarioBackend[]>("/api/horarios/");

  return data.map((h) => ({
    id: h.id,
    carrera_codigo: h.carrera_codigo,
    carrera_nombre: h.carrera_nombre || h.carrera_codigo,
    materia: Number(h.materia ?? 0),
    nivel: h.nivel ?? "",
    comision: h.comision || "",
    materia_nombre: h.materia_nombre,
    hora_inicio: h.hora_inicio,
    hora_fin: h.hora_fin,
    dia_semana: h.dia_semana,
    aula: h.espacio || "",
  }));
}
