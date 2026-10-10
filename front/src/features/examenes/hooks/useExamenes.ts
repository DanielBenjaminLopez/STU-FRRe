import { useEffect, useMemo, useState } from "react";
import type { Examen } from "../api/examenes";
import { fetchExamenes } from "../api/examenes";
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

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isMesaVigente(
  fecha?: string,
  todayDateStr: string = getTodayDateString(),
): boolean {
  if (!fecha) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha >= todayDateStr;
  }
  const parts = fecha.split(/[-/]/).map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    if (parts[0] > 1900) {
      const formatted = `${parts[0]}-${parts[1].toString().padStart(2, "0")}-${parts[2].toString().padStart(2, "0")}`;
      return formatted >= todayDateStr;
    }
    if (parts[2] > 1900) {
      const formatted = `${parts[2]}-${parts[1].toString().padStart(2, "0")}-${parts[0].toString().padStart(2, "0")}`;
      return formatted >= todayDateStr;
    }
  }
  return true;
}

export function useExamenes() {
  const [todas, setTodas] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const realtimeEvent = useTotemRealtime();
  const relevantEvent =
    realtimeEvent?.resource === "examenes" ? realtimeEvent : null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchExamenes();
        if (!mounted) return;
        setTodas(data);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Error al cargar exámenes");
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
  }, [relevantEvent, realtimeEvent?.type]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const today = getTodayDayName();
  const todayDate = getTodayDateString();

  const vigentes = useMemo(() => {
    return todas.filter((c) => isMesaVigente(c.fecha, todayDate));
  }, [todas, todayDate]);

  const examenesHoy = todas.filter((c) =>
    c.fecha ? c.fecha === todayDate : c.dia_semana === today,
  );

  const now = getMinutes(
    `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
  );

  const ahora = examenesHoy.filter((c) => {
    const start = getMinutes(c.hora_inicio);
    const end = getMinutes(c.hora_fin);
    return now >= start && now < end;
  });

  const siguiente = examenesHoy.filter((c) => {
    const start = getMinutes(c.hora_inicio);
    return now < start;
  });

  const uniqueCarreras = useMemo(
    () =>
      [
        ...new Set(vigentes.map((c) => c.carrera_codigo).filter(Boolean)),
      ].sort(),
    [vigentes],
  );

  return { ahora, siguiente, todas: vigentes, uniqueCarreras, loading, error };
}
