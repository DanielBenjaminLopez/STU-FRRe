import { totemFetch } from "./client";

export interface Clase {
  id: number;
  carrera_codigo: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
}

interface HorarioBackend {
  id: number;
  comision: number;
  espacio: number;
  materia_nombre: string;
  espacio_nombre: string;
  carrera_codigo: string;
  comision_nombre: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export async function fetchHorarios(): Promise<Clase[]> {
  const data = await totemFetch<HorarioBackend[]>("/api/horarios/");
  return data
    .filter((h) => h.activo)
    .map((h) => ({
      id: h.id,
      carrera_codigo: h.carrera_codigo,
      comision: h.comision_nombre,
      materia_nombre: h.materia_nombre,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      dia_semana: h.dia_semana,
      aula: h.espacio_nombre,
    }));
}
