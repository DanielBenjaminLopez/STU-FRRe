import { useEffect, useMemo, useRef, useState } from "react";
import type { Clase } from "../api/horarios";
import { fetchHorarios } from "../api/horarios";
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

export function useHorarios(enabled = true) {
  const [todas, setTodas] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const hasLoadedRef = useRef(false);
  const realtimeEvent = useTotemRealtime();
  const relevantEvent =
    realtimeEvent?.resource === "horarios" ? realtimeEvent : null;

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;
      try {
        if (!hasLoadedRef.current) {
          setLoading(true);
        }
        setError(null);
        const clases = await fetchHorarios();
        if (!mounted) return;
        hasLoadedRef.current = true;
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
  }, [enabled, relevantEvent]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [enabled]);

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
