import { useEffect, useState } from "react";
import type { EventoCalendario } from "../api/calendario";
import { fetchEventosCalendario } from "../api/calendario";

export function useCalendario() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEventosCalendario();
        if (!mounted) return;
        setEventos(data);
      } catch (e) {
        if (mounted) {
          setError(
            e instanceof Error ? e.message : "Error al cargar el calendario",
          );
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

  return { eventos, loading, error };
}
