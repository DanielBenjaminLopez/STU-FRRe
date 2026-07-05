// When backend endpoint is ready, import apiFetch and use it in fetchHorarios:
// import { apiFetch } from "./client";

export interface Clase {
  id: number;
  carrera_codigo: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
}

function getTodayDayName(): string {
  const days = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  return days[new Date().getDay()];
}

function generateMockClases(): Clase[] {
  const today = getTodayDayName();
  return [
    {
      id: 1,
      carrera_codigo: "ISI",
      comision: "K2.1",
      materia_nombre: "Algoritmos y Estructuras de Datos",
      hora_inicio: "08:00",
      hora_fin: "10:00",
      dia_semana: today,
    },
    {
      id: 2,
      carrera_codigo: "IEM",
      comision: "K2.1",
      materia_nombre: "Algoritmos y Estructuras de Datos",
      hora_inicio: "08:00",
      hora_fin: "10:00",
      dia_semana: today,
    },
    {
      id: 3,
      carrera_codigo: "IQ",
      comision: "K3.2",
      materia_nombre: "Análisis Matemático II",
      hora_inicio: "10:00",
      hora_fin: "12:00",
      dia_semana: today,
    },
    {
      id: 4,
      carrera_codigo: "LAR",
      comision: "L1.1",
      materia_nombre: "Introducción al Derecho",
      hora_inicio: "10:00",
      hora_fin: "12:00",
      dia_semana: today,
    },
    {
      id: 5,
      carrera_codigo: "ISI",
      comision: "K3.1",
      materia_nombre: "Laboratorio de Software",
      hora_inicio: "14:00",
      hora_fin: "16:00",
      dia_semana: today,
    },
    {
      id: 6,
      carrera_codigo: "IEM",
      comision: "M1.1",
      materia_nombre: "Física II",
      hora_inicio: "14:00",
      hora_fin: "16:00",
      dia_semana: today,
    },
    {
      id: 7,
      carrera_codigo: "IQ",
      comision: "Q1.3",
      materia_nombre: "Química General",
      hora_inicio: "16:00",
      hora_fin: "18:00",
      dia_semana: today,
    },
  ];
}

export async function fetchHorarios(): Promise<Clase[]> {
  // TODO: Cambiar esto por una llamada a la API
  // 1. Uncomment the import at the top:
  //    import { apiFetch } from "./client";
  // 2. Replace the body with:
  //    return apiFetch<Clase[]>("/api/horarios/");

  return new Promise((resolve) => {
    setTimeout(() => resolve(generateMockClases()), 400);
  });
}
