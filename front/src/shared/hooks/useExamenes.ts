import { useEffect, useState } from "react";
import type { Examen } from "../api/examenes";
import { fetchExamenes } from "../api/examenes";
import { useTotemRealtime } from "../context/TotemRealtimeContext";

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
      if (realtimeEvent && !relevantEvent) return;
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
  }, [relevantEvent]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const today = getTodayDayName();
  const examenesHoy = todas.filter((c) => c.dia_semana === today);

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

  return { ahora, siguiente, todas, loading, error };
}
