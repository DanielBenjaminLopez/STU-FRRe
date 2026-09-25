import { useEffect, useMemo, useState } from "react";
import type { Clase } from "../api/horarios";
import {
  fetchComisionesHorarios,
  fetchHorarios,
  fetchPlanMateriasHorarios,
} from "../api/horarios";
import { useTotemRealtime } from "../../../shared/context/TotemRealtimeContext";

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

function getMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function normalizeValue(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function useHorarios() {
  const [todas, setTodas] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const realtimeEvent = useTotemRealtime();
  const relevantEvent =
    realtimeEvent?.resource === "horarios" ? realtimeEvent : null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;
      try {
        setLoading(true);
        setError(null);
        const [planMaterias, comisiones, data] = await Promise.all([
          fetchPlanMateriasHorarios().catch(() => []),
          fetchComisionesHorarios().catch(() => []),
          fetchHorarios(),
        ]);
        const nivelesPorPlan = new Map(
          planMaterias.map((planMateria) => [
            planMateria.id,
            {
              nivel: planMateria.nivel,
              carreraNombre: planMateria.carrera_nombre || "",
              modalidad: normalizeValue(planMateria.modalidad),
              cuatrimestre: normalizeValue(planMateria.cuatrimestre),
            },
          ]),
        );
        const nivelPorComision = new Map(
          comisiones.map((comision) => [
            comision.id,
            comision.nivel ||
              nivelesPorPlan.get(comision.plan_materia)?.nivel ||
              "",
          ]),
        );
        const clases = data.map((clase) => ({
          ...clase,
          carrera_nombre:
            nivelesPorPlan.get(clase.plan_materia)?.carreraNombre ||
            clase.carrera_nombre,
          nivel:
            clase.nivel ||
            nivelPorComision.get(clase.comision_id) ||
            nivelesPorPlan.get(clase.plan_materia)?.nivel ||
            "",
          modalidad:
            nivelesPorPlan.get(clase.plan_materia)?.modalidad ||
            clase.modalidad,
          cuatrimestre:
            nivelesPorPlan.get(clase.plan_materia)?.cuatrimestre ||
            normalizeValue(clase.cuatrimestre),
        }));
        if (!mounted) return;
        setTodas(clases);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Error al cargar horarios");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const fetchInterval = setInterval(load, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(fetchInterval);
    };
  }, [relevantEvent]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const today = getTodayDayName();
  const clasesHoy = todas.filter((c) => c.dia_semana === today);

  const now = getMinutes(
    `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
  );

  const ahora = clasesHoy.filter((c) => {
    const start = getMinutes(c.hora_inicio);
    const end = getMinutes(c.hora_fin);
    return now >= start && now < end;
  });

  const siguiente = clasesHoy.filter((c) => {
    const start = getMinutes(c.hora_inicio);
    return now < start;
  });

  const uniqueCarreras = useMemo(
    () => [...new Set(todas.map((c) => c.carrera_codigo))].sort(),
    [todas],
  );

  return { ahora, siguiente, todas, uniqueCarreras, loading, error };
}
