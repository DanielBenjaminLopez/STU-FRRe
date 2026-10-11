import { useRef, useState, useLayoutEffect } from "react";

const TOTEM_WIDTH = 2160;
const TOTEM_HEIGHT = 3840;

export interface TotemScaleOptions {
  /**
   * "adaptive": scale = width / TOTEM_WIDTH, y height adaptada al viewport real.
   * Elimina letterboxing en pantallas 18:9, 16:9, etc. manteniendo márgenes uniformes.
   * "fit": escala para contener TOTEM_WIDTH x targetHeight sin deformar (para previews de admin).
   */
  mode?: "adaptive" | "fit";
  targetHeight?: number;
}

function calcMetrics(
  width: number,
  height: number,
  mode: "adaptive" | "fit",
  targetHeight: number,
): { scale: number; stageHeight: number } {
  if (width === 0 || height === 0) {
    return { scale: 1, stageHeight: targetHeight };
  }
  if (mode === "fit") {
    const scale = Math.min(width / TOTEM_WIDTH, height / targetHeight);
    return { scale, stageHeight: targetHeight };
  }
  // Adaptive mode
  const scale = width / TOTEM_WIDTH;
  const stageHeight = scale > 0 ? Math.round(height / scale) : targetHeight;
  return { scale, stageHeight };
}

const SCALE_EPSILON = 0.001;

export function useTotemScale(options: TotemScaleOptions = {}) {
  const { mode = "adaptive", targetHeight = TOTEM_HEIGHT } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(targetHeight);
  const [isReady, setIsReady] = useState(false);
  const prevScaleRef = useRef(1);
  const prevHeightRef = useRef(targetHeight);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = (width: number, height: number) => {
      const next = calcMetrics(width, height, mode, targetHeight);
      const scaleChanged =
        Math.abs(next.scale - prevScaleRef.current) >= SCALE_EPSILON;
      const heightChanged =
        Math.abs(next.stageHeight - prevHeightRef.current) >= 1;

      if (scaleChanged || heightChanged) {
        prevScaleRef.current = next.scale;
        prevHeightRef.current = next.stageHeight;
        setScale(next.scale);
        setStageHeight(next.stageHeight);
      }
      setIsReady(true);
    };

    const { width, height } = el.getBoundingClientRect();
    if (width !== 0 && height !== 0) {
      const initial = calcMetrics(width, height, mode, targetHeight);
      prevScaleRef.current = initial.scale;
      prevHeightRef.current = initial.stageHeight;
      setScale(initial.scale);
      setStageHeight(initial.stageHeight);
    }
    setIsReady(true);

    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w === 0 || h === 0) return;
      updateScale(w, h);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [mode, targetHeight]);

  return { containerRef, scale, stageHeight, isReady };
}

export { TOTEM_WIDTH, TOTEM_HEIGHT };
