import { TOTEM_WIDTH, TOTEM_HEIGHT } from "../hooks/useTotemScale";

/**
 * Opción B: Contenedor CSS-only sin JS.
 * Usa container queries (cqw/cqh) para calcular scale = min(100cqw/2160, 100cqh/3840)
 * sin ResizeObserver ni estado React. Ideal para tótem 4K (scale=2) donde
 * el hook JS causaba capa de 8.3Mpx con re-renders.
 *
 * Uso:
 *   <TotemStageCSS>
 *     <Avisos /> <Encabezado /> ...
 *   </TotemStageCSS>
 *
 * Fallback automático a 100vw/vh si no hay soporte para 100cqw.
 */
export function TotemStageCSS({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="totem-scale-container totem-scale-container--css">
      <div
        className={`totem-scale-stage totem-scale-stage--css bg-white overflow-hidden ${className}`}
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Opción A: Wrapper JS optimizado (usa useTotemScale internamente pero
 * expone solo children). Para admin/preview donde se necesita onScaleChange.
 * Este componente ya aplica will-change/contain/transformOrigin.
 */
export function TotemStageJS({
  children,
  scale,
  containerRef,
  origin = "center",
}: {
  children: React.ReactNode;
  scale: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  origin?: "center" | "top";
}) {
  return (
    <div ref={containerRef} className="totem-scale-container">
      <div
        className="totem-scale-stage bg-white overflow-hidden"
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: origin === "top" ? "top center" : "center center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
