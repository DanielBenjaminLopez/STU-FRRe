import { describe, it, expect, vi } from "vitest";
import { fetchExamenes } from "../api/examenes";

vi.mock("../../../shared/api/client", () => ({
  totemFetch: vi.fn().mockResolvedValue([
    {
      id: 1,
      plan_materia: 1,
      espacio: 1,
      materia_nombre: "Algoritmos y Estructuras de Datos",
      espacio_nombre: "Aula 1.1",
      carrera_codigo: "ISI",
      fecha: "2026-09-21",
      hora: "08:00:00",
      turno: "septiembre",
      llamado: 1,
      dia_semana: "lunes",
      activo: true,
    },
    {
      id: 2,
      plan_materia: 2,
      espacio: 2,
      materia_nombre: "Física II",
      espacio_nombre: "Aula 1.2",
      carrera_codigo: "IEM",
      fecha: "2026-09-22",
      hora: "10:00:00",
      turno: "septiembre",
      llamado: 1,
      dia_semana: "martes",
      activo: true,
    },
    {
      id: 3,
      plan_materia: 3,
      espacio: 3,
      materia_nombre: "Inactiva",
      espacio_nombre: "Aula 1.3",
      carrera_codigo: "IQ",
      fecha: "2026-09-23",
      hora: "14:00:00",
      turno: "septiembre",
      llamado: 1,
      dia_semana: "miercoles",
      activo: false,
    },
  ]),
}));

describe("fetchExamenes", () => {
  it("retorna un array de exámenes activos mapeados", async () => {
    const examenes = await fetchExamenes();
    expect(Array.isArray(examenes)).toBe(true);
    expect(examenes.length).toBe(2);
  });

  it("cada examen tiene los campos requeridos", async () => {
    const examenes = await fetchExamenes();
    for (const examen of examenes) {
      expect(examen).toHaveProperty("id");
      expect(examen).toHaveProperty("carrera_codigo");
      expect(examen).toHaveProperty("comision");
      expect(examen).toHaveProperty("materia_nombre");
      expect(examen).toHaveProperty("hora_inicio");
      expect(examen).toHaveProperty("hora_fin");
      expect(examen).toHaveProperty("dia_semana");
      expect(examen).toHaveProperty("aula");
    }
  });

  it("mapea los campos correctamente", async () => {
    const examenes = await fetchExamenes();
    expect(examenes[0]).toEqual({
      id: 1,
      carrera_codigo: "ISI",
      comision: "1° llamado",
      materia_nombre: "Algoritmos y Estructuras de Datos",
      hora_inicio: "08:00",
      hora_fin: "10:00",
      dia_semana: "lunes",
      aula: "Aula 1.1",
      fecha: "2026-09-21",
    });
  });

  it("los ids son únicos", async () => {
    const examenes = await fetchExamenes();
    const ids = examenes.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
