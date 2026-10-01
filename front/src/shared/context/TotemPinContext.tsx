import { createContext, useContext, type ReactNode } from "react";
import type {
  FloorKey,
  PinPosition,
} from "../../features/mapa/components/MapaRaw";

const TotemPinContext = createContext<PinPosition | null>(null);
const TotemOrientationContext = createContext<number>(0);

// eslint-disable-next-line react-refresh/only-export-components
export function getTotemPinPosition(
  totem:
    | {
        pin_mapa_piso?: string | null;
        pin_mapa_svg_x?: number | null;
        pin_mapa_svg_y?: number | null;
      }
    | null
    | undefined,
): PinPosition | null {
  if (
    totem?.pin_mapa_piso &&
    totem.pin_mapa_svg_x !== null &&
    totem.pin_mapa_svg_x !== undefined &&
    totem.pin_mapa_svg_y !== null &&
    totem.pin_mapa_svg_y !== undefined
  ) {
    return {
      floor: totem.pin_mapa_piso as FloorKey,
      svgX: totem.pin_mapa_svg_x,
      svgY: totem.pin_mapa_svg_y,
    };
  }
  return null;
}

export function TotemPinProvider({
  value,
  orientation = 0,
  children,
}: {
  value: PinPosition | null;
  orientation?: number;
  children: ReactNode;
}) {
  return (
    <TotemPinContext.Provider value={value}>
      <TotemOrientationContext.Provider value={orientation}>
        {children}
      </TotemOrientationContext.Provider>
    </TotemPinContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTotemPin(): PinPosition | null {
  return useContext(TotemPinContext);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTotemOrientation(): number {
  return useContext(TotemOrientationContext);
}
