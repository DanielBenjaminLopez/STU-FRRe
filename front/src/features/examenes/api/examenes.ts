import { totemFetch } from "../../../shared/api/client";

export interface Examen {
  id: number;
  carrera_codigo: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
  fecha?: string;
}

interface MesaExamenBackend {
  id: number;
  carrera?: number | null;
  carrera_codigo?: string;
  materia?: string;
  materia_nombre?: string;
  espacio?: string;
  fecha?: string;
  hora?: string;
  dia_semana?: string;
}

function calculateHoraFin(horaInicio: string): string {
  const [h, m] = horaInicio.split(":").map(Number);
  if (isNaN(h)) return "10:00";
  const endH = Math.min(23, h + 2);
  return `${endH.toString().padStart(2, "0")}:${(m || 0).toString().padStart(2, "0")}`;
}

export async function fetchExamenes(): Promise<Examen[]> {
  const data = await totemFetch<MesaExamenBackend[]>("/api/mesas-examen/", {
    cache: "no-store",
  });
  return data.map((m) => {
    const horaInicio = m.hora ? m.hora.slice(0, 5) : "08:00";
    return {
      id: m.id,
      carrera_codigo: m.carrera_codigo || "",
      comision: "",
      materia_nombre: m.materia || m.materia_nombre || "",
      hora_inicio: horaInicio,
      hora_fin: calculateHoraFin(horaInicio),
      dia_semana: m.dia_semana || "",
      aula: m.espacio || "",
      fecha: m.fecha,
    };
  });
}
