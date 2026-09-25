import { useCallback, useEffect, useState } from "react";
import type { EventoCalendarioAdmin } from "../api/calendarioAdmin";
import { fetchEventosCalendario } from "../api/calendarioAdmin";

export function useCalendarioAdmin() {
  const [eventos, setEventos] = useState<EventoCalendarioAdmin[]>([]);
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

    return () => {
      mounted = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEventosCalendario();
      setEventos(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al cargar el calendario",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { eventos, loading, error, reload };
}
