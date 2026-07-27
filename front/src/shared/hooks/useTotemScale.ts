import { useRef, useState, useEffect } from "react";

const TOTEM_WIDTH = 1080;
const TOTEM_HEIGHT = 1920;

export function useTotemScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      const s = Math.min(width / TOTEM_WIDTH, height / TOTEM_HEIGHT);
      setScale(s);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

export { TOTEM_WIDTH, TOTEM_HEIGHT };
