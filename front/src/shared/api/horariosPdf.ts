import { getAdminToken } from "./client";

export interface HorarioRow {
  anio: string;
  comision: string;
  materia: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  aula: string | null;
}

export interface UploadResult {
  task_id: string;
  total_horarios: number;
  paginas_procesadas: number;
  errores: string[];
}

export interface HorarioPreview {
  carrera: string;
  cuatrimestre: string;
  anio_plan: number;
  paginas_procesadas: number;
  total_horarios: number;
  horarios: HorarioRow[];
  errores: string[];
}

export interface ImportResult {
  detail: string;
  horarios_creados: number;
  materias_creadas: number;
  comisiones_creadas: number;
  espacios_creados: number;
  errores: string[];
}

export async function uploadHorarioPdf(file: File): Promise<UploadResult> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await fetch("/api/upload-horarios/", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${response.status}`);
  }

  return response.json();
}

export async function getHorarioPreview(
  taskId: string,
): Promise<HorarioPreview> {
  const token = getAdminToken();
  const response = await fetch(`/api/horarios/preview/${taskId}/`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${response.status}`);
  }

  return response.json();
}

export async function confirmHorarioImport(
  taskId: string,
  overrides?: { horarios?: HorarioRow[] },
): Promise<ImportResult> {
  const token = getAdminToken();
  const response = await fetch(`/api/horarios/import/${taskId}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(overrides || {}),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${response.status}`);
  }

  return response.json();
}
