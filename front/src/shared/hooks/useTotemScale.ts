import { useRef, useState, useLayoutEffect } from "react";

const TOTEM_WIDTH = 1080;
const TOTEM_HEIGHT = 1920;

function calcScale(width: number, height: number): number {
  if (width === 0 || height === 0) return 1;
  return Math.min(width / TOTEM_WIDTH, height / TOTEM_HEIGHT);
}

export function useTotemScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setScale(calcScale(width, height));
    }
    setIsReady(true);

    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0) {
        setScale(calcScale(w, h));
        setIsReady(true);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale, isReady };
}

export { TOTEM_WIDTH, TOTEM_HEIGHT };
