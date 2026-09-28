import { useState, useEffect, useRef } from "react";
import { fetchAvisosActivos, type Aviso } from "../api/avisos";
import { useTotemRealtime } from "../context/TotemRealtimeContext";

const REFRESH_MS = 5 * 60_000;

export function useAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);
  const realtimeEvent = useTotemRealtime();
  const relevantEvent =
    realtimeEvent?.resource === "avisos" ? realtimeEvent : null;

  useEffect(() => {
    mountedRef.current = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;

      try {
        const data = await fetchAvisosActivos();
        if (mountedRef.current) {
          setAvisos(data);
          setError(false);
        }
      } catch {
        if (mountedRef.current) setError(true);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    load();
    const refreshTimer = setInterval(load, REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(refreshTimer);
    };
  }, [relevantEvent, realtimeEvent?.type]);

  const visible = !loading && !error && avisos.length > 0;

  return { avisos, loading, error, visible };
}
