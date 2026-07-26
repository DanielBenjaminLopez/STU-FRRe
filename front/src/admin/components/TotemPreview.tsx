import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import { useTotemScale, TOTEM_WIDTH, TOTEM_HEIGHT } from "../../shared/hooks/useTotemScale";
import { useTotem } from "../../shared/context/TotemContext";
import { WIDGET_REGISTRY, type WidgetType, type Plantilla } from "../pages/plantillas/types";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
};

const STORAGE_KEY = "plantillas";
const ACTIVAS_KEY = "plantillas_activas";

function loadPlantillas(): Plantilla[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function loadActivePlantillaId(totemId: string): string | null {
  try {
    const saved = localStorage.getItem(ACTIVAS_KEY);
    if (!saved) return null;
    const mapping: Record<string, string> = JSON.parse(saved);
    return mapping[totemId] ?? null;
  } catch {
    return null;
  }
}

export default function TotemPreview() {
  const { containerRef, scale } = useTotemScale();
  const { selectedId } = useTotem();

  const activeId = selectedId ? loadActivePlantillaId(selectedId) : null;
  const plantillas = loadPlantillas();
  const plantilla = activeId ? plantillas.find((p) => p.id === activeId) ?? null : null;

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div
        className="shrink-0 bg-white border border-gray-200 rounded-3xl overflow-hidden"
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <div className="flex flex-col w-full h-full p-16 gap-16">
          <Encabezado />
          <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4">
            {plantilla && plantilla.widgets.length > 0
              ? plantilla.widgets.map((w) => {
                  const Component = WIDGET_COMPONENTS[w.type];
                  const def = WIDGET_REGISTRY[w.type];
                  if (!Component || !def) return null;
                  return (
                    <div
                      key={w.id}
                      className="overflow-hidden grid"
                      style={{
                        gridColumn: `${w.col + 1} / span ${def.colSpan}`,
                        gridRow: `${w.row + 1} / span ${def.rowSpan}`,
                        gridTemplateColumns: `repeat(${def.colSpan}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${def.rowSpan}, minmax(0, 1fr))`,
                      }}
                    >
                      <Component />
                    </div>
                  );
                })
              : (
                <div className="col-span-4 row-span-6 flex items-center justify-center p-8">
                  <p className="text-gray-400 text-center text-lg leading-relaxed">
                    Próximamente encontrarás aquí los horarios de cursada y novedades del campus.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
