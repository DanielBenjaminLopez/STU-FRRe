import { useState } from "react";
import { AnimatePresence } from "motion/react";
import MapaFull from "./MapaFull";
import MapaRaw, { type PinPosition } from "./MapaRaw";
import {
  useTotemPin,
  useTotemOrientation,
} from "../../../shared/context/TotemPinContext";
import { useOnTotemReset } from "../../../shared/context/TotemResetContext";

export interface MapaProps {
  pinPosition?: PinPosition | null;
  orientation?: number;
  colSpan?: number;
  rowSpan?: number;
}

export default function Mapa({
  pinPosition: pinPositionProp,
  orientation: orientationProp,
  colSpan = 2,
  rowSpan = 2,
}: MapaProps) {
  const isCompactRow = rowSpan === 1;
  const [showFull, setShowFull] = useState(false);
  useOnTotemReset(() => setShowFull(false));
  // Si se provee la prop directamente (ej: admin), úsala; si no, leé del contexto del tótem
  const contextPin = useTotemPin();
  const contextOrientation = useTotemOrientation();
  const pinPosition =
    pinPositionProp !== undefined ? pinPositionProp : contextPin;
  const orientation =
    orientationProp !== undefined ? orientationProp : contextOrientation;

  return (
    <>
      <AnimatePresence>
        {showFull && (
          <MapaFull
            onClose={() => setShowFull(false)}
            pinPosition={pinPosition}
            orientation={orientation}
          />
        )}
      </AnimatePresence>

      <div
        data-testid="mapa-widget"
        data-variant={`${colSpan}x${rowSpan}`}
        className={`w-full h-full col-span-2 ${
          isCompactRow
            ? "row-span-1 flex-row gap-6"
            : "row-span-2 flex-col gap-4"
        } bg-linear-to-br from-indigo-300/50 to-indigo-300/60 rounded-4xl flex items-center p-6 overflow-hidden`}
      >
        {isCompactRow ? (
          <div
            data-testid="mapa-header"
            className="flex flex-col items-center justify-center gap-4 flex-1 min-w-0 h-full text-center"
          >
            <span className="text-xl font-semibold">Mapa interactivo</span>
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="shadow-xs text-sm font-medium bg-white/50 hover:bg-white/70 active:bg-white/80 border border-gray-200 px-8 py-1 rounded-2xl cursor-pointer transition-all"
            >
              Ver mapa
            </button>
          </div>
        ) : (
          <div
            data-testid="mapa-header"
            className="relative w-full flex flex-row gap-2 items-center"
          >
            <span className="text-xl font-semibold">Mapa interactivo</span>
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="shadow-xs absolute top-1/2 -translate-y-1/2 right-0 text-sm font-medium bg-white/50 hover:bg-white/70 active:bg-white/80 border border-gray-200 px-8 py-1 rounded-2xl cursor-pointer transition-all"
            >
              Ver mapa
            </button>
          </div>
        )}
        <div
          data-testid="mapa-preview-container"
          className={`flex items-center justify-center ${
            isCompactRow ? "flex-1 min-w-0" : "w-full"
          } h-full bg-white/50 rounded-3xl pointer-events-none border border-gray-200 overflow-hidden`}
        >
          <MapaRaw
            compact
            pinPosition={pinPosition}
            orientation={orientation}
          />
        </div>
      </div>
    </>
  );
}
