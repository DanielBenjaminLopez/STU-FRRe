import { totemFetch } from "../../../shared/api/client";

export interface Clase {
  id: number;
  carrera_codigo: string;
  carrera_nombre: string;
  plan_materia: number;
  comision_id: number;
  nivel: string;
  modalidad: string;
  cuatrimestre: string;
  comision: string;
  materia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: string;
  aula: string;
}

interface HorarioBackend {
  id: number;
  comision: number | string;
  plan_materia?: number | string;
  espacio: number;
  materia_nombre: string;
  espacio_nombre: string;
  carrera_codigo: string;
  nivel?: string;
  comision_nombre: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

interface PlanMateriaBackend {
  id: number | string;
  carrera_codigo?: string;
  carrera_nombre?: string;
  nivel: string;
  modalidad?: string | null;
  cuatrimestre?: string | null;
}

interface ComisionHorarioBackend {
  id: number | string;
  plan_materia: number | string;
  nivel?: string;
}

export async function fetchPlanMateriasHorarios(): Promise<
  PlanMateriaBackend[]
> {
  const data = await totemFetch<PlanMateriaBackend[]>("/api/plan-materias/");
  return data.map((planMateria) => ({
    ...planMateria,
    id: Number(planMateria.id),
  }));
}

export async function fetchComisionesHorarios(): Promise<
  ComisionHorarioBackend[]
> {
  const data = await totemFetch<ComisionHorarioBackend[]>("/api/comisiones/");
  return data.map((comision) => ({
    ...comision,
    id: Number(comision.id),
    plan_materia: Number(comision.plan_materia),
  }));
}

export async function fetchHorarios(
  planMaterias: PlanMateriaBackend[] = [],
): Promise<Clase[]> {
  const data = await totemFetch<HorarioBackend[]>("/api/horarios/");
  const nivelesPorPlan = new Map(
    planMaterias.map((planMateria) => [planMateria.id, planMateria.nivel]),
  );

  return data
    .filter((h) => h.activo)
    .map((h) => ({
      id: h.id,
      carrera_codigo: h.carrera_codigo,
      carrera_nombre: h.carrera_codigo,
      plan_materia: Number(h.plan_materia ?? 0),
      comision_id: Number(h.comision),
      nivel: h.nivel ?? nivelesPorPlan.get(Number(h.plan_materia ?? 0)) ?? "",
      modalidad: "",
      cuatrimestre: "",
      comision: h.comision_nombre,
      materia_nombre: h.materia_nombre,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      dia_semana: h.dia_semana,
      aula: h.espacio_nombre,
    }));
}
