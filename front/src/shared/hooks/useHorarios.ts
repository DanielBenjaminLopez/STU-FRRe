import { useEffect, useState } from "react";
import type { Clase } from "../api/horarios";
import { fetchHorarios } from "../api/horarios";

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

export function useHorarios() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHorarios();
        if (!mounted) return;

        const today = getTodayDayName();
        setClases(data.filter((c) => c.dia_semana === today));
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
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const now = getMinutes(
    `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
  );

  const ahora = clases.filter((c) => {
    const start = getMinutes(c.hora_inicio);
    const end = getMinutes(c.hora_fin);
    return now >= start && now < end;
  });

  const siguiente = clases.filter((c) => {
    const start = getMinutes(c.hora_inicio);
    return now < start;
  });

  return { ahora, siguiente, loading, error };
}
