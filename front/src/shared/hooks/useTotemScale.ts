import { useRef, useState, useLayoutEffect } from "react";

const TOTEM_WIDTH = 2160;
const TOTEM_HEIGHT = 3840;

function calcScale(width: number, height: number): number {
  if (width === 0 || height === 0) return 1;
  return Math.min(width / TOTEM_WIDTH, height / TOTEM_HEIGHT);
}

const SCALE_EPSILON = 0.001;

export function useTotemScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const prevScaleRef = useRef(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = (width: number, height: number) => {
      const next = calcScale(width, height);
      // Evitar renders y tormenta de ResizeObserver: solo actualizar si cambio significativo
      // No filtrar el caso 0->valor, solo el caso 1->1 inicial sin tamaño
      if (Math.abs(next - prevScaleRef.current) < SCALE_EPSILON) return;
      prevScaleRef.current = next;
      setScale(next);
    };

    const { width, height } = el.getBoundingClientRect();
    const initial = calcScale(width, height);
    // Si el contenedor ya tiene tamaño (no 0), inicializar sincrónicamente
    if (width !== 0 && height !== 0) {
      if (Math.abs(initial - prevScaleRef.current) >= SCALE_EPSILON) {
        prevScaleRef.current = initial;
        setScale(initial);
      }
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w === 0 || h === 0) return;
      updateScale(w, h);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

export { TOTEM_WIDTH, TOTEM_HEIGHT };
