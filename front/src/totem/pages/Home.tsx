import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import Calendar from "../../shared/components/widgets/Calendar";
import Mapa from "../../shared/components/widgets/Mapa";
import {
  useTotemScale,
  TOTEM_WIDTH,
  TOTEM_HEIGHT,
} from "../../shared/hooks/useTotemScale";
import {
  WIDGET_REGISTRY,
  type WidgetType,
  type Plantilla,
} from "../../admin/pages/plantillas/types";

const AUTH_TOKEN_KEY = "auth_token";
const STORAGE_KEY = "plantillas";
const ACTIVAS_KEY = "plantillas_activas";
const TOTEM_ID_KEY = "selected_totem_id";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
  calendario: Calendar,
  mapa: Mapa,
};

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

function loadTotemId(): string | null {
  try {
    return localStorage.getItem(TOTEM_ID_KEY);
  } catch {
    return null;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { containerRef, scale } = useTotemScale();

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      navigate("/onboarding", { replace: true });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
    }
  }, [navigate]);

  if (checking) return null;

  const totemId = loadTotemId();
  const activeId = totemId ? loadActivePlantillaId(totemId) : null;
  const plantillas = loadPlantillas();
  const plantilla = activeId
    ? (plantillas.find((p) => p.id === activeId) ?? null)
    : null;

  const hasWidgets = plantilla && plantilla.widgets.length > 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden"
    >
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
            {hasWidgets ? (
              plantilla.widgets.map((w) => {
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
            ) : (
              <>
                <Horarios />
                <Examenes />
                <Calendar />
                <Mapa />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
