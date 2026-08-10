import { useState, useEffect, useRef, useCallback } from "react";
import { useNoticias } from "../../hooks/useNoticias";
import NoticiasFull from "./NoticiasFull";
import { NoticiaCarouselSkeleton } from "../ui/Skeleton";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const AUTO_ROTATE_MS = 5000;

export default function Noticias() {
  const { feed, loading, error } = useNoticias();
  const [showFull, setShowFull] = useState(false);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (feed.length === 0) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % feed.length);
    }, AUTO_ROTATE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [feed.length]);

  const handleDotClick = useCallback(
    (index: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrent(index);
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % feed.length);
      }, AUTO_ROTATE_MS);
    },
    [feed.length],
  );

  return (
    <>
      {showFull && <NoticiasFull onClose={() => setShowFull(false)} />}

      {loading && <NoticiaCarouselSkeleton />}

      {!loading && error && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-purple-300/50 to-purple-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full justify-between">
            <span className="text-xl font-semibold">Noticias y eventos</span>
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && feed.length === 0 && (
        <div className="col-span-4 row-span-2 bg-linear-to-b from-purple-300/50 to-purple-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full justify-between">
            <span className="text-xl font-semibold">Noticias y eventos</span>
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-sm text-gray-400">
              No hay noticias recientes
            </span>
          </div>
        </div>
      )}

      {!loading && !error && feed.length > 0 && (
        <div className="relative w-full h-full col-span-4 row-span-2 rounded-4xl overflow-hidden">
          {feed.map((item, i) => {
            const isActive = i === current;
            const badgeLabel =
              item.tipo === "evento"
                ? (item.tipo_evento ?? "Evento")
                : item.origen === "scraping"
                  ? "UTN FRRe"
                  : "Noticia";

            const badgeColor =
              item.tipo === "evento"
                ? "bg-green-500/80"
                : item.origen === "scraping"
                  ? "bg-blue-500/80"
                  : "bg-purple-500/80";

            return (
              <div
                key={`${item.tipo}-${item.id}`}
                className={`absolute inset-0 transition-opacity duration-500 rounded-4xl overflow-hidden ${
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-purple-400 to-purple-600" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/70" />

                <div className="absolute bottom-4 left-0 right-0 z-10 p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium text-white rounded-full backdrop-blur-sm ${badgeColor}`}
                    >
                      {badgeLabel}
                    </span>
                    <span className="text-xs text-white/70">
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
                    {item.titulo}
                  </h3>
                  {item.contenido && (
                    <p className="text-sm text-white/80 line-clamp-1">
                      {item.contenido}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {feed.map((item, i) => (
              <button
                key={`${item.tipo}-${item.id}`}
                type="button"
                onClick={() => handleDotClick(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-2 w-full justify-between">
            <span className="text-xl text-white font-semibold">
              Noticias y eventos
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="absolute top-8 right-8 z-20 shadow-xs text-sm font-medium bg-white/20 backdrop-blur-sm text-white border border-white/20 px-4 py-1 rounded-2xl transition-colors"
          >
            Ver todas
          </button>
        </div>
      )}
    </>
  );
}
