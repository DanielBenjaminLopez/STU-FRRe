import { createContext, useContext } from "react";

export type ContentResource =
  | "calendario"
  | "noticias"
  | "avisos"
  | "horarios"
  | "examenes"
  | "eventos";

export interface RealtimeEvent {
  type: string;
  resource?: ContentResource;
}

const TotemRealtimeContext = createContext<RealtimeEvent | null>(null);

export const TotemRealtimeProvider = TotemRealtimeContext.Provider;

export function useTotemRealtime() {
  return useContext(TotemRealtimeContext);
}
