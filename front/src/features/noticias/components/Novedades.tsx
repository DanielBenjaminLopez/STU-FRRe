import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { useNovedades } from "../hooks/useNoticias";
import NovedadesFull from "./NovedadesFull";
import { NovedadesCarouselSkeleton } from "../../../shared/components/ui/Skeleton";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const AUTO_ROTATE_MS = 10000;

export default function Novedades() {
  const { feed, loading, error } = useNovedades();
  const [showFull, setShowFull] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extended feed with clones at both ends for infinite looping
  const extendedFeed = useMemo(() => {
    if (feed.length <= 1) return feed;
    return [feed[feed.length - 1], ...feed, feed[0]];
  }, [feed]);

  // Initial scroll to the first real slide (index 1 in extended feed)
  useEffect(() => {
    if (!scrollRef.current || feed.length <= 1) return;
    const initScroll = () => {
      if (scrollRef.current) {
        const width = scrollRef.current.clientWidth;
        if (width > 0 && scrollRef.current.scrollLeft === 0) {
          scrollRef.current.style.scrollBehavior = "auto";
          scrollRef.current.scrollLeft = width;
          scrollRef.current.style.scrollBehavior = "";
        }
      }
    };
    initScroll();
    const frame = requestAnimationFrame(initScroll);
    return () => cancelAnimationFrame(frame);
  }, [feed]);

  // Check if we reached a clone slide and silently jump to the matching real slide
  const checkInfiniteScroll = useCallback(() => {
    if (!scrollRef.current || feed.length <= 1) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;

    const rawIndex = Math.round(scrollLeft / clientWidth);
    if (rawIndex === 0) {
      // Swiped left past first slide -> jump to real last slide
      scrollRef.current.style.scrollBehavior = "auto";
      scrollRef.current.scrollLeft = feed.length * clientWidth;
      scrollRef.current.style.scrollBehavior = "";
      setCurrent(feed.length - 1);
    } else if (rawIndex === feed.length + 1) {
      // Swiped right past last slide -> jump to real first slide
      scrollRef.current.style.scrollBehavior = "auto";
      scrollRef.current.scrollLeft = 1 * clientWidth;
      scrollRef.current.style.scrollBehavior = "";
      setCurrent(0);
    } else {
      setCurrent(rawIndex - 1);
    }
  }, [feed.length]);

  // Listen to native scrollend where available
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScrollEnd = () => checkInfiniteScroll();
    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [checkInfiniteScroll]);

  const handlePrev = useCallback(() => {
    if (!scrollRef.current || feed.length <= 1) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const rawIndex = Math.round(scrollLeft / clientWidth);
    const targetLeft = (rawIndex - 1) * clientWidth;
    if (typeof scrollRef.current.scrollTo === "function") {
      scrollRef.current.scrollTo({ left: targetLeft, behavior: "smooth" });
    } else {
      scrollRef.current.scrollLeft = targetLeft;
    }
  }, [feed.length]);

  const handleNext = useCallback(() => {
    if (!scrollRef.current || feed.length <= 1) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const rawIndex = Math.round(scrollLeft / clientWidth);
    const targetLeft = (rawIndex + 1) * clientWidth;
    if (typeof scrollRef.current.scrollTo === "function") {
      scrollRef.current.scrollTo({ left: targetLeft, behavior: "smooth" });
    } else {
      scrollRef.current.scrollLeft = targetLeft;
    }
  }, [feed.length]);

  const handleDotClick = useCallback(
    (index: number) => {
      if (!scrollRef.current) return;
      const clientWidth = scrollRef.current.clientWidth;
      const targetIndex = feed.length > 1 ? index + 1 : index;
      const targetLeft = targetIndex * clientWidth;
      if (typeof scrollRef.current.scrollTo === "function") {
        scrollRef.current.scrollTo({ left: targetLeft, behavior: "smooth" });
      } else {
        scrollRef.current.scrollLeft = targetLeft;
      }
      setCurrent(index);
    },
    [feed.length],
  );

  // Auto-rotate every 10 seconds
  useEffect(() => {
    if (feed.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, AUTO_ROTATE_MS);

    return () => clearInterval(timer);
  }, [feed.length, isPaused, handleNext]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isDraggingRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;

    const rawIndex = Math.round(scrollLeft / clientWidth);
    if (feed.length > 1) {
      const realIndex = (rawIndex - 1 + feed.length) % feed.length;
      if (realIndex >= 0 && realIndex < feed.length) {
        setCurrent(realIndex);
      }
    } else {
      setCurrent(0);
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      checkInfiniteScroll();
    }, 150);
  }, [feed.length, checkInfiniteScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    startScrollLeftRef.current = scrollRef.current.scrollLeft;
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;
    scrollRef.current.scrollLeft = startScrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPaused(false);
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const snapIndex = Math.round(scrollLeft / clientWidth);
      const targetLeft = snapIndex * clientWidth;
      if (typeof scrollRef.current.scrollTo === "function") {
        scrollRef.current.scrollTo({ left: targetLeft, behavior: "smooth" });
      } else {
        scrollRef.current.scrollLeft = targetLeft;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (typeof scrollRef.current.scrollBy === "function") {
        scrollRef.current.scrollBy({ left: e.deltaY, behavior: "smooth" });
      } else {
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {showFull && <NovedadesFull onClose={() => setShowFull(false)} />}
      </AnimatePresence>

      {loading && <NovedadesCarouselSkeleton />}

      {!loading && error && (
        <div className="w-full h-full col-span-4 row-span-2 bg-linear-to-b from-amber-300/50 to-amber-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full justify-between">
            <span className="text-xl font-semibold">Eventos</span>
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && feed.length === 0 && (
        <div className="w-full h-full col-span-4 row-span-2 bg-linear-to-b from-amber-300/50 to-amber-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
          <div className="flex flex-col gap-2 w-full justify-between">
            <span className="text-xl font-semibold">Eventos</span>
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-sm text-gray-500 font-medium">
              No hay eventos recientes
            </span>
          </div>
        </div>
      )}

      {!loading && !error && feed.length > 0 && (
        <div
          className="relative w-full h-full col-span-4 row-span-2 rounded-4xl overflow-hidden group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            if (isDraggingRef.current) {
              isDraggingRef.current = false;
              if (scrollRef.current) {
                const { scrollLeft, clientWidth } = scrollRef.current;
                const snapIndex = Math.round(scrollLeft / clientWidth);
                const targetLeft = snapIndex * clientWidth;
                if (typeof scrollRef.current.scrollTo === "function") {
                  scrollRef.current.scrollTo({
                    left: targetLeft,
                    behavior: "smooth",
                  });
                } else {
                  scrollRef.current.scrollLeft = targetLeft;
                }
              }
            }
          }}
        >
          {/* Horizontal scroll container with scroll snap */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {extendedFeed.map((item, index) => {
              const badgeLabel =
                item.tipo === "evento"
                  ? (item.tipo_evento ?? "Evento")
                  : "Novedad";

              const badgeColor =
                item.tipo === "evento" ? "bg-amber-500/90" : "bg-purple-500/80";

              const key =
                feed.length > 1 && index === 0
                  ? `clone-last-${item.tipo}-${item.id}`
                  : feed.length > 1 && index === extendedFeed.length - 1
                    ? `clone-first-${item.tipo}-${item.id}`
                    : `real-${item.tipo}-${item.id}-${index}`;

              return (
                <div
                  key={key}
                  className="relative w-full h-full shrink-0 snap-center snap-always rounded-4xl overflow-hidden"
                >
                  {item.imagen_url ? (
                    <img
                      src={item.imagen_url}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-amber-400 to-amber-600 pointer-events-none" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/70 pointer-events-none" />

                  <div className="absolute bottom-4 left-0 right-0 z-10 px-16 pb-8 flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center justify-center h-6 px-3 text-xs font-semibold text-white rounded-full backdrop-blur-sm shadow-xs border border-transparent ${badgeColor}`}
                      >
                        {badgeLabel}
                      </span>
                      {item.espacio_nombre && (
                        <span className="inline-flex items-center justify-center gap-1.5 h-6 px-3 text-xs font-semibold text-amber-950 rounded-full backdrop-blur-md bg-amber-200/90 border border-amber-300/50 shadow-xs">
                          <svg
                            className="w-3 h-3 text-amber-900/80 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {item.espacio_nombre}
                        </span>
                      )}
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
          </div>

          {/* Left Arrow Button < */}
          {feed.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Publicación anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 active:bg-white/50 backdrop-blur-md border border-white/20 text-white shadow-lg cursor-pointer transition-all pointer-events-auto"
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
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Right Arrow Button > */}
          {feed.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente publicación"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 active:bg-white/50 backdrop-blur-md border border-white/20 text-white shadow-lg cursor-pointer transition-all pointer-events-auto"
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
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Dots Indicator */}
          {feed.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-auto">
              {feed.map((item, i) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  type="button"
                  onClick={() => handleDotClick(i)}
                  aria-label={`Ir a publicación ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                    i === current ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Title Header */}
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-2 justify-between pointer-events-none">
            <span className="text-xl text-white font-semibold">Eventos</span>
          </div>

          {/* Button Ver todas */}
          {feed.length > 1 && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="absolute top-8 right-8 z-20 shadow-xs text-sm font-medium bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20 px-4 py-1 rounded-2xl transition-colors cursor-pointer pointer-events-auto"
            >
              Ver todas
            </button>
          )}
        </div>
      )}
    </>
  );
}
