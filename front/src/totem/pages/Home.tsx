import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import Calendar from "../../shared/components/widgets/Calendar";
import Mapa from "../../shared/components/widgets/Mapa";
import Noticias from "../../shared/components/widgets/Noticias";
import Avisos from "../../shared/components/widgets/Avisos";
import {
  useTotemScale,
  TOTEM_WIDTH,
  TOTEM_HEIGHT,
} from "../../shared/hooks/useTotemScale";
import {
  plantillaDTOToLocal,
  type WidgetType,
  type Plantilla,
} from "../../admin/pages/plantillas/types";
import { ApiError, getTotemToken } from "../../shared/api/client";
import { fetchTotemMe, type Totem } from "../../shared/api/totems";
import { useTotemWebSocket } from "../../shared/hooks/useTotemWebSocket";
import { TotemRealtimeProvider } from "../../shared/context/TotemRealtimeContext";
import { TotemPinProvider } from "../../shared/context/TotemPinContext";
import type { PinPosition } from "../../shared/components/widgets/MapaRaw";
import type { FloorKey } from "../../shared/components/widgets/MapaRaw";

const POLLING_MS = 5 * 60_000;

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  horarios: Horarios,
  examenes: Examenes,
  calendario: Calendar,
  mapa: Mapa,
  noticias: Noticias,
};

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [totem, setTotem] = useState<Totem | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const totemRef = useRef<Totem | null>(null);
  const { containerRef, scale } = useTotemScale();
  const { lastMessage } = useTotemWebSocket(null, true);

  const load = useCallback(async () => {
    try {
      const me = await fetchTotemMe();
      totemRef.current = me;
      setTotem(me);
      setBlocked(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexión";
      if (message === "Tótem desactivado") {
        setBlocked(true);
        setBlockedMessage(message);
        return;
      }
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        navigate("/onboarding", { replace: true });
        return;
      }
      if (!totemRef.current) {
        setBlocked(true);
        setBlockedMessage("Sin conexión con el servidor");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!getTotemToken()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, POLLING_MS);
    return () => clearInterval(timer);
  }, [navigate, load]);

  useEffect(() => {
    if (lastMessage?.type === "configuracion_actualizada") {
      // The message invalidates the cached configuration; fetch the source of truth.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
  }, [lastMessage, load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(false);
  }, []);

  if (checking) return null;

  if (blocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-black text-white p-8">
        <svg
          className="w-16 h-16 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-2xl font-semibold text-gray-300">
          Tótem fuera de servicio
        </p>
        <p className="text-sm text-gray-500">
          {blockedMessage === "Tótem desactivado"
            ? "Este tótem fue desactivado. Contactá a administración."
            : "No se pudo conectar con el servidor. Se reintentará automáticamente."}
        </p>
      </div>
    );
  }

  const plantilla: Plantilla | null = totem?.plantilla
    ? plantillaDTOToLocal(totem.plantilla)
    : null;
  const hasWidgets = plantilla && plantilla.widgets.length > 0;

  const pinPosition: PinPosition | null =
    totem?.pin_mapa_piso &&
    totem.pin_mapa_svg_x !== null &&
    totem.pin_mapa_svg_y !== null
      ? {
          floor: totem.pin_mapa_piso as FloorKey,
          svgX: totem.pin_mapa_svg_x!,
          svgY: totem.pin_mapa_svg_y!,
        }
      : null;

  return (
    <TotemRealtimeProvider value={lastMessage}>
      <TotemPinProvider value={pinPosition}>
        <div ref={containerRef} className="totem-scale-container">
          <div
            className="totem-scale-stage bg-white overflow-hidden"
            style={{
              width: TOTEM_WIDTH,
              height: TOTEM_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            <div className="flex flex-col w-full h-full p-16 gap-16">
              <Avisos />
              <Encabezado />
              <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4">
                {hasWidgets ? (
                  plantilla.widgets.map((w) => {
                    const Component = WIDGET_COMPONENTS[w.type];
                    if (!Component) return null;
                    return (
                      <div
                        key={w.id}
                        className="overflow-hidden grid"
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
      </TotemPinProvider>
    </TotemRealtimeProvider>
  );
}
