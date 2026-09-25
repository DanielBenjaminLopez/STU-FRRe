import { Avisos, Encabezado } from "../../features/layout";
import {
  useTotemScale,
  TOTEM_WIDTH,
  TOTEM_HEIGHT,
} from "../../shared/hooks/useTotemScale";
import { useTotem } from "../../shared/context/TotemContext";
import { plantillaDTOToLocal } from "../../features/widgets/placement";
import { WIDGET_COMPONENTS } from "../../features/widgets";

export default function TotemPreview() {
  const { containerRef, scale, isReady } = useTotemScale();
  const { selectedTotem } = useTotem();

  const plantilla = selectedTotem?.plantilla
    ? plantillaDTOToLocal(selectedTotem.plantilla)
    : null;

  const isVisible = isReady !== false;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-start overflow-hidden p-4"
    >
      <div
        className={`totem-scale-stage bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          willChange: "transform",
        }}
      >
        <div
          key={selectedTotem?.id ?? "none"}
          className="flex flex-col w-full h-full p-16 gap-16 relative animate-totem-switch"
        >
          <Avisos />
          <Encabezado />
          <div className="relative flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4">
            {plantilla && plantilla.widgets.length > 0 ? (
              plantilla.widgets.map((w) => {
                const Component = WIDGET_COMPONENTS[w.type];
                if (!Component) return null;
                return (
                  <div
                    key={w.id}
                    className="overflow-hidden grid rounded-3xl"
                    style={{
                      gridColumn: `${w.col + 1} / span ${w.colSpan}`,
                      gridRow: `${w.row + 1} / span ${w.rowSpan}`,
                      gridTemplateColumns: `repeat(${w.colSpan}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${w.rowSpan}, minmax(0, 1fr))`,
                    }}
                  >
                    <Component />
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 row-span-6 flex items-center justify-center p-8">
                <p className="text-gray-400 text-center text-lg leading-relaxed">
                  Próximamente encontrarás aquí los horarios de cursada y
                  novedades del campus.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
