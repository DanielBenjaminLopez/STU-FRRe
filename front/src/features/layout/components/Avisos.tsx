import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Aviso } from "../api/avisos";

function formatFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface AvisosProps {
  avisos: Aviso[];
}

export default function Avisos({ avisos }: AvisosProps) {
  const [scrollDistance, setScrollDistance] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measureOverflow = () => {
      setScrollDistance(Math.max(0, track.scrollWidth - viewport.clientWidth));
    };

    measureOverflow();
    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

    return () => resizeObserver.disconnect();
  }, [avisos]);

  const marqueeStyle = {
    "--avisos-scroll-distance": `-${scrollDistance}px`,
  } as CSSProperties;

  return (
    <div className="flex w-full items-center overflow-hidden rounded-4xl bg-red-300/50 px-5 pr-0 text-black">
      <h1 className="z-10 shrink-0 border-r border-red-950/20 pr-4 text-xl font-semibold select-none">
        Avisos
      </h1>
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden py-2">
        <div
          ref={trackRef}
          style={marqueeStyle}
          className={`avisos-marquee flex w-max px-1 gap-16 whitespace-nowrap ${
            scrollDistance > 0 ? "avisos-marquee-overflowing" : ""
          }`}
        >
          {avisos.map((aviso) => (
            <span key={aviso.id} className="flex items-center gap-3 text-base">
              <span className="rounded-full bg-white/50 px-3 py-1 text-sm font-semibold tabular-nums text-black shadow-sm">
                {formatFecha(aviso.fecha)}
              </span>
              <span className="font-normal">{aviso.motivo}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
