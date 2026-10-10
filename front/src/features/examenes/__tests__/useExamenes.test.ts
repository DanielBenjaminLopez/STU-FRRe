import { describe, expect, it, vi } from "vitest";
import { isMesaVigente, getTodayDateString } from "../hooks/useExamenes";

describe("isMesaVigente helper", () => {
  const referenceToday = "2026-10-10";

  it("permite mesas sin fecha (fallback)", () => {
    expect(isMesaVigente(undefined, referenceToday)).toBe(true);
    expect(isMesaVigente("", referenceToday)).toBe(true);
  });

  it("permite mesas del día de hoy", () => {
    expect(isMesaVigente("2026-10-10", referenceToday)).toBe(true);
  });

  it("permite mesas con fecha futura", () => {
    expect(isMesaVigente("2026-10-11", referenceToday)).toBe(true);
    expect(isMesaVigente("2026-11-01", referenceToday)).toBe(true);
    expect(isMesaVigente("2027-02-15", referenceToday)).toBe(true);
  });

  it("filtra y descarta mesas con fechas pasadas", () => {
    expect(isMesaVigente("2026-10-09", referenceToday)).toBe(false);
    expect(isMesaVigente("2026-09-30", referenceToday)).toBe(false);
    expect(isMesaVigente("2025-12-10", referenceToday)).toBe(false);
  });

  it("soporta formato alternativo DD/MM/YYYY o DD-MM-YYYY", () => {
    expect(isMesaVigente("09/10/2026", referenceToday)).toBe(false);
    expect(isMesaVigente("10/10/2026", referenceToday)).toBe(true);
    expect(isMesaVigente("15/10/2026", referenceToday)).toBe(true);
  });

  it("usa la fecha actual por defecto", () => {
    const today = getTodayDateString();
    expect(isMesaVigente(today)).toBe(true);
  });
});

describe("useExamenes hook", () => {
  it("filtra mesas pasadas de 'todas' y calcula carreras únicas solo de mesas vigentes", async () => {
    const { renderHook, waitFor } = await import("@testing-library/react");
    const examenesApi = await import("../api/examenes");
    const { useExamenes } = await import("../hooks/useExamenes");

    const spy = vi.spyOn(examenesApi, "fetchExamenes").mockResolvedValue([
      {
        id: 1,
        carrera_codigo: "OLD_CAR",
        comision: "K1",
        materia_nombre: "Mesa Pasada",
        hora_inicio: "08:00",
        hora_fin: "10:00",
        dia_semana: "ayer",
        aula: "1",
        fecha: "2020-01-01",
      },
      {
        id: 2,
        carrera_codigo: "ISI",
        comision: "K1",
        materia_nombre: "Mesa Hoy",
        hora_inicio: "10:00",
        hora_fin: "12:00",
        dia_semana: "hoy",
        aula: "2",
        fecha: getTodayDateString(),
      },
      {
        id: 3,
        carrera_codigo: "IEM",
        comision: "M1",
        materia_nombre: "Mesa Futura",
        hora_inicio: "14:00",
        hora_fin: "16:00",
        dia_semana: "manana",
        aula: "3",
        fecha: "2099-12-31",
      },
    ]);

    const { result } = renderHook(() => useExamenes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Solo debe incluir la de hoy y la futura
    expect(result.current.todas.map((m) => m.materia_nombre)).toEqual([
      "Mesa Hoy",
      "Mesa Futura",
    ]);

    // uniqueCarreras no debe incluir la carrera de la mesa pasada
    expect(result.current.uniqueCarreras).toEqual(["IEM", "ISI"]);

    spy.mockRestore();
  });
});
