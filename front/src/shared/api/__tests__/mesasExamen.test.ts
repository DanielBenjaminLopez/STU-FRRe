import { describe, it, expect } from "vitest";
import { getTurnoFromFecha } from "../mesasExamen";

describe("getTurnoFromFecha", () => {
  it("determina el turno correcto para cada mes estándar en formato YYYY-MM-DD", () => {
    expect(getTurnoFromFecha("2026-01-15")).toBe("febrero");
    expect(getTurnoFromFecha("2026-02-20")).toBe("febrero");
    expect(getTurnoFromFecha("2026-03-05")).toBe("marzo");
    expect(getTurnoFromFecha("2026-04-18")).toBe("abril");
    expect(getTurnoFromFecha("2026-05-10")).toBe("abril");
    expect(getTurnoFromFecha("2026-05-25")).toBe("junio");
    expect(getTurnoFromFecha("2026-06-12")).toBe("junio");
    expect(getTurnoFromFecha("2026-07-08")).toBe("junio");
    expect(getTurnoFromFecha("2026-07-28")).toBe("agosto");
    expect(getTurnoFromFecha("2026-08-14")).toBe("agosto");
    expect(getTurnoFromFecha("2026-09-22")).toBe("septiembre");
    expect(getTurnoFromFecha("2026-10-10")).toBe("octubre");
    expect(getTurnoFromFecha("2026-11-25")).toBe("diciembre");
    expect(getTurnoFromFecha("2026-12-15")).toBe("diciembre");
  });

  it("soporta formato con hora YYYY-MM-DDTHH:mm", () => {
    expect(getTurnoFromFecha("2026-03-10T08:00")).toBe("marzo");
    expect(getTurnoFromFecha("2026-12-05T14:30:00Z")).toBe("diciembre");
  });

  it("soporta formato DD/MM/YYYY", () => {
    expect(getTurnoFromFecha("15/02/2026")).toBe("febrero");
    expect(getTurnoFromFecha("20/08/2026")).toBe("agosto");
  });

  it("retorna null para valores vacíos o inválidos", () => {
    expect(getTurnoFromFecha("")).toBeNull();
    expect(getTurnoFromFecha("invalido")).toBeNull();
    expect(getTurnoFromFecha("2026-")).toBeNull();
  });
});
