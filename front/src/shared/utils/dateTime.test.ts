import { describe, it, expect, afterEach, vi } from "vitest";
import { getCurrentTime, getCurrentDate, getGreeting } from "./dateTime";

afterEach(() => {
  vi.useRealTimers();
});

describe("getCurrentTime", () => {
  it("devuelve la hora en formato HH:MM", () => {
    vi.setSystemTime(new Date("2026-06-05T14:30:00"));
    expect(getCurrentTime()).toMatch(/^\d{2}:\d{2}$/);
  });

  it("devuelve la hora en formato de 24 horas", () => {
    vi.setSystemTime(new Date("2026-06-05T23:05:00"));
    expect(getCurrentTime()).toBe("23:05");
  });

  it("rellena con cero a la izquierda las horas y minutos de un dígito", () => {
    vi.setSystemTime(new Date("2026-06-05T09:01:00"));
    expect(getCurrentTime()).toBe("09:01");
  });
});

describe("getCurrentDate", () => {
  it("devuelve la fecha en español con día, número, mes y año", () => {
    vi.setSystemTime(new Date("2026-06-05T10:00:00"));
    const result = getCurrentDate();
    expect(result).toMatch(/^\w+, \d{1,2} de \w+ de 2026$/);
  });

  it("devuelve el formato correcto para una fecha conocida", () => {
    vi.setSystemTime(new Date("2026-06-05T10:00:00"));
    expect(getCurrentDate()).toBe("viernes, 5 de junio de 2026");
  });
});

describe("getGreeting", () => {
  it('devuelve "¡Buenos días!" de 05:00 a 11:59', () => {
    vi.setSystemTime(new Date("2026-06-05T05:00:00"));
    expect(getGreeting()).toBe("¡Buenos días!");

    vi.setSystemTime(new Date("2026-06-05T11:59:59"));
    expect(getGreeting()).toBe("¡Buenos días!");
  });

  it('devuelve "¡Buenas tardes!" de 12:00 a 19:59', () => {
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(getGreeting()).toBe("¡Buenas tardes!");

    vi.setSystemTime(new Date("2026-06-05T19:59:59"));
    expect(getGreeting()).toBe("¡Buenas tardes!");
  });

  it('devuelve "¡Buenas noches!" de 20:00 a 04:59', () => {
    vi.setSystemTime(new Date("2026-06-05T20:00:00"));
    expect(getGreeting()).toBe("¡Buenas noches!");

    vi.setSystemTime(new Date("2026-06-05T23:59:59"));
    expect(getGreeting()).toBe("¡Buenas noches!");

    vi.setSystemTime(new Date("2026-06-05T00:00:00"));
    expect(getGreeting()).toBe("¡Buenas noches!");

    vi.setSystemTime(new Date("2026-06-05T04:59:59"));
    expect(getGreeting()).toBe("¡Buenas noches!");
  });
});
