import { createContext, useContext, type ReactNode } from "react";
import type { PinPosition } from "../components/widgets/MapaRaw";

const TotemPinContext = createContext<PinPosition | null>(null);

export function TotemPinProvider({
  value,
  children,
}: {
  value: PinPosition | null;
  children: ReactNode;
}) {
  return (
    <TotemPinContext.Provider value={value}>
      {children}
    </TotemPinContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTotemPin(): PinPosition | null {
  return useContext(TotemPinContext);
}
