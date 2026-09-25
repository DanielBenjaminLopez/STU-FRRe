import { useState, useEffect, useRef } from "react";
import {
  fetchFeed,
  fetchFeedScraping,
  fetchFeedCreados,
  type ContenidoFeed,
} from "../api/noticias";
import { useTotemRealtime } from "../../../shared/context/TotemRealtimeContext";

const REFRESH_MS = 5 * 60_000;
const TICK_MS = 30_000;

export type NoticiasFilter = "all" | "scraping" | "creados";

export interface UseNoticiasOptions {
  filter?: NoticiasFilter;
}

export function useNoticias(options?: UseNoticiasOptions) {
  const filter = options?.filter ?? "all";
  const [feed, setFeed] = useState<ContenidoFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const realtimeEvent = useTotemRealtime();

  const isResourceRelevant =
    filter === "scraping"
      ? realtimeEvent?.resource === "noticias"
      : realtimeEvent?.resource === "noticias" ||
        realtimeEvent?.resource === "eventos";

  const relevantEvent = isResourceRelevant ? realtimeEvent : null;

  useEffect(() => {
    mountedRef.current = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;
      try {
        let data: ContenidoFeed[];
        if (filter === "scraping") {
          data = await fetchFeedScraping();
        } else if (filter === "creados") {
          data = await fetchFeedCreados();
        } else {
          data = await fetchFeed();
        }

        if (mountedRef.current) {
          setFeed(data);
          setError(null);
        }
      } catch {
        if (mountedRef.current) {
          setError(
            filter === "creados"
              ? "No se pudieron cargar los eventos"
              : "No se pudieron cargar las noticias",
          );
        }
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
  }, [filter, relevantEvent, realtimeEvent?.type]);

  return { feed, loading, error };
}

export function useNoticiasScraping() {
  return useNoticias({ filter: "scraping" });
}

export function useNovedades() {
  return useNoticias({ filter: "creados" });
}
