import { apiFetch } from "./client";

export interface WidgetDTO {
  id: number;
  nombre: string;
  tipo: string;
  col_tam_default: number;
  fila_tam_default: number;
  activo: boolean;
  creado_en: string;
}

export async function fetchWidgets(): Promise<WidgetDTO[]> {
  return apiFetch<WidgetDTO[]>("/api/widgets/");
}
