import { describe, it, expect } from "vitest";
import { fetchHorarios, type Clase } from "../horarios";

describe("fetchHorarios", () => {
  it("retorna un array de clases", async () => {
    const clases = await fetchHorarios();
    expect(Array.isArray(clases)).toBe(true);
    expect(clases.length).toBeGreaterThan(0);
  });

  it("cada clase tiene los campos requeridos", async () => {
    const clases = await fetchHorarios();
    for (const clase of clases) {
      expect(clase).toHaveProperty("id");
      expect(clase).toHaveProperty("carrera_codigo");
      expect(clase).toHaveProperty("comision");
      expect(clase).toHaveProperty("materia_nombre");
      expect(clase).toHaveProperty("hora_inicio");
      expect(clase).toHaveProperty("hora_fin");
      expect(clase).toHaveProperty("dia_semana");
      expect(clase).toHaveProperty("aula");
    }
  });

  it("retorna clases con días de la semana válidos", async () => {
    const clases = await fetchHorarios();
    const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes"];
    for (const clase of clases) {
      expect(diasValidos).toContain(clase.dia_semana);
    }
  });

  it("retorna al menos una clase", async () => {
    const clases = await fetchHorarios();
    expect(clases.length).toBeGreaterThanOrEqual(1);
  });

  it("los ids son únicos", async () => {
    const clases = await fetchHorarios();
    const ids = clases.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
