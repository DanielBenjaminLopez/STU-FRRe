import { useState, useEffect, useRef } from "react";
import { fetchFeed, type ContenidoFeed } from "../api/noticias";
import { useTotemRealtime } from "../context/TotemRealtimeContext";

const REFRESH_MS = 5 * 60_000;
const TICK_MS = 30_000;

export function useNoticias() {
  const [feed, setFeed] = useState<ContenidoFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const realtimeEvent = useTotemRealtime();
  const relevantEvent =
    realtimeEvent?.resource === "noticias" ? realtimeEvent : null;

  useEffect(() => {
    mountedRef.current = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;
      try {
        const data = await fetchFeed();
        if (mountedRef.current) {
          setFeed(data);
          setError(null);
        }
      } catch {
        if (mountedRef.current) setError("No se pudieron cargar las noticias");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    load();

    const refreshTimer = setInterval(load, REFRESH_MS);
    const tickTimer = setInterval(() => {
      setFeed((prev) => [...prev]);
    }, TICK_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(refreshTimer);
      clearInterval(tickTimer);
    };
  }, [relevantEvent]);

  return { feed, loading, error };
}
