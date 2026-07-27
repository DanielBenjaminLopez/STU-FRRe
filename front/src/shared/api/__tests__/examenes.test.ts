import { describe, it, expect } from "vitest";
import { fetchExamenes, type Examen } from "../examenes";

describe("fetchExamenes", () => {
  it("retorna un array de exámenes", async () => {
    const examenes = await fetchExamenes();
    expect(Array.isArray(examenes)).toBe(true);
    expect(examenes.length).toBeGreaterThan(0);
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

  it("retorna exámenes con días de la semana válidos", async () => {
    const examenes = await fetchExamenes();
    const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes"];
    for (const examen of examenes) {
      expect(diasValidos).toContain(examen.dia_semana);
    }
  });

  it("retorna al menos un examen", async () => {
    const examenes = await fetchExamenes();
    expect(examenes.length).toBeGreaterThanOrEqual(1);
  });

  it("los ids son únicos", async () => {
    const examenes = await fetchExamenes();
    const ids = examenes.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
