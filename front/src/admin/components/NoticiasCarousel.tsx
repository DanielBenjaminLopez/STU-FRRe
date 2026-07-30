import { useState, useEffect, useCallback, useRef } from "react";
import type { Noticia } from "../../shared/api/noticias";
import NoticiaDetailModal from "./NoticiaDetailModal";

const ROTATION_INTERVAL = 5000;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface NoticiasCarouselProps {
  noticias: Noticia[];
}

export default function NoticiasCarousel({ noticias }: NoticiasCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<Noticia | null>(null);
  const touchStartX = useRef(0);

  const total = noticias.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(next, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next, total]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }

  if (total === 0) return null;

  const noticia = noticias[current];

  return (
    <>
      {selected && (
        <NoticiaDetailModal
          noticia={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <div
        className="relative w-full h-[560px] rounded-3xl overflow-hidden group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {noticia.imagen_url ? (
          <img
            src={noticia.imagen_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <button
          type="button"
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-medium text-white bg-white/20 rounded-full backdrop-blur-sm">
              {noticia.origen === "scraping" ? "UTN FRRe" : "Manual"}
            </span>
            <span className="text-xs text-white/70">
              {formatDate(noticia.fecha_publicacion)}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
            {noticia.titulo}
          </h3>
          <p className="text-sm text-white/80 line-clamp-1">
            {noticia.contenido}
          </p>
          <button
            type="button"
            onClick={() => setSelected(noticia)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white mt-1 w-fit px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
          >
            Leer más
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
          {noticias.map((_, i) => (
            <button
              key={noticias[i].id}
              type="button"
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
