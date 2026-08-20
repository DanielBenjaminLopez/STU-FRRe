import { useEffect, useRef, useState, type CSSProperties } from "react";
import { fetchAvisosActivos, type Aviso } from "../../api/avisos";
import { useTotemRealtime } from "../../context/TotemRealtimeContext";

const REFRESH_MS = 5 * 60_000;

function formatFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    paro: "Paro",
    inasistencia: "Inasistencia",
    feriado: "Feriado",
    otro: "Aviso",
  };

  return labels[tipo] ?? tipo;
}

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const realtimeEvent = useTotemRealtime();
  const relevantEvent =
    realtimeEvent?.resource === "avisos" ? realtimeEvent : null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (realtimeEvent?.type === "contenido_actualizado" && !relevantEvent)
        return;

      try {
        const data = await fetchAvisosActivos();
        if (mounted) {
          setAvisos(data);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const refreshTimer = setInterval(load, REFRESH_MS);

    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, [relevantEvent, realtimeEvent?.type]);

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

  if (loading || error || avisos.length === 0) return null;

  const marqueeStyle = {
    "--avisos-scroll-distance": `-${scrollDistance}px`,
  } as CSSProperties;

  return (
    <div className="absolute top-2 left-0 z-30 flex w-full items-center overflow-hidden rounded-4xl bg-red-300/50 px-5 pr-0 text-black">
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
              <span className="font-semibold">{getTipoLabel(aviso.tipo)}:</span>
              <span className="font-normal">{aviso.motivo}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
