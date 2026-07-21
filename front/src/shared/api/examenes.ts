// When backend endpoint is ready, import apiFetch and use it in fetchExamenes:
// import { apiFetch } from "./client";

export interface Examen {
  id: number;
  carrera_codigo: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
}

function generateMockExamenes(): Examen[] {
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  let id = 1;

  const examenesPorDia: Array<{
    carrera_codigo: string;
    comision: string;
    materia_nombre: string;
    hora_inicio: string;
    hora_fin: string;
    aula: string;
  }>[] = [
    // lunes
    [
      {
        carrera_codigo: "ISI",
        comision: "K2.1",
        materia_nombre: "Algoritmos y Estructuras de Datos",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.1",
      },
      {
        carrera_codigo: "IEM",
        comision: "K2.1",
        materia_nombre: "Algoritmos y Estructuras de Datos",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.2",
      },
      {
        carrera_codigo: "IQ",
        comision: "K3.2",
        materia_nombre: "Análisis Matemático II",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.3",
      },
    ],
    // martes
    [
      {
        carrera_codigo: "ISI",
        comision: "K2.1",
        materia_nombre: "Análisis Matemático II",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.3",
      },
      {
        carrera_codigo: "LAR",
        comision: "L1.1",
        materia_nombre: "Derecho Constitucional",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.8",
      },
      {
        carrera_codigo: "IEM",
        comision: "M1.1",
        materia_nombre: "Termodinámica",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.9",
      },
    ],
    // miércoles
    [
      {
        carrera_codigo: "IEM",
        comision: "K2.1",
        materia_nombre: "Algoritmos y Estructuras de Datos",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.2",
      },
      {
        carrera_codigo: "ISI",
        comision: "K2.1",
        materia_nombre: "Sistemas Operativos",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.4",
      },
      {
        carrera_codigo: "IQ",
        comision: "K3.2",
        materia_nombre: "Análisis Matemático II",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.6",
      },
    ],
    // jueves
    [
      {
        carrera_codigo: "ISI",
        comision: "K3.1",
        materia_nombre: "Base de Datos I",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.8",
      },
      {
        carrera_codigo: "IQ",
        comision: "Q1.3",
        materia_nombre: "Química General",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.9",
      },
      {
        carrera_codigo: "LAR",
        comision: "L1.1",
        materia_nombre: "Derecho Civil",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.10",
      },
    ],
    // viernes
    [
      {
        carrera_codigo: "ISI",
        comision: "K2.1",
        materia_nombre: "Algoritmos y Estructuras de Datos",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.2",
      },
      {
        carrera_codigo: "IEM",
        comision: "K2.1",
        materia_nombre: "Ingeniería de Software",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        aula: "1.4",
      },
      {
        carrera_codigo: "LAR",
        comision: "L1.1",
        materia_nombre: "Filosofía del Derecho",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        aula: "1.6",
      },
    ],
  ];

  const examenes: Examen[] = [];
  for (let i = 0; i < dias.length; i++) {
    for (const h of examenesPorDia[i]) {
      examenes.push({ id: id++, ...h, dia_semana: dias[i] });
    }
  }
  return examenes;
}

export async function fetchExamenes(): Promise<Examen[]> {
  // TODO: Cambiar esto por una llamada a la API
  // 1. Uncomment the import at the top:
  //    import { apiFetch } from "./client";
  // 2. Replace the body with:
  //    return apiFetch<Examen[]>("/api/examenes/");

  return new Promise((resolve) => {
    setTimeout(() => resolve(generateMockExamenes()), 400);
  });
}
