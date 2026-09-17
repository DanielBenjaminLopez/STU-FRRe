import { describe, expect, it } from "vitest";
import { formatAula } from "./formatAula";

describe("formatAula", () => {
  it("debe anteponer 'Aula ' si solo se pasa un número o identificación", () => {
    expect(formatAula("12")).toBe("Aula 12");
    expect(formatAula("2.10")).toBe("Aula 2.10");
    expect(formatAula("1.1")).toBe("Aula 1.1");
  });

  it("no debe duplicar 'Aula' si el valor ya comienza con 'Aula'", () => {
    expect(formatAula("Aula 2.10")).toBe("Aula 2.10");
    expect(formatAula("aula 2.10")).toBe("Aula 2.10");
    expect(formatAula("Aula Magna")).toBe("Aula Magna");
  });

  it("debe limpiar si ya venía duplicado como 'Aula Aula 2.10'", () => {
    expect(formatAula("Aula Aula 2.10")).toBe("Aula 2.10");
  });

  it("no debe agregar 'Aula' si ya especifica un Laboratorio, Sala o Taller", () => {
    expect(formatAula("Laboratorio informático 4")).toBe(
      "Laboratorio informático 4",
    );
    expect(formatAula("lab 1")).toBe("Lab 1");
    expect(formatAula("Sala de computación")).toBe("Sala de computación");
  });

  it("maneja valores vacíos o nulos", () => {
    expect(formatAula("")).toBe("");
    expect(formatAula(null)).toBe("");
    expect(formatAula(undefined)).toBe("");
    expect(formatAula("   ")).toBe("");
  });
});
