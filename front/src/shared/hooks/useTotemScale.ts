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

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    setScale(calcScale(width, height));

    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setScale(calcScale(w, h));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

export { TOTEM_WIDTH, TOTEM_HEIGHT };
