import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../client";

describe("client API", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockResponse(body: unknown, status = 400) {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  it("extrae error por campo de validación DRF", async () => {
    mockResponse({ codigo_vinculacion: ["Código de vinculación inválido."] });
    await expect(apiFetch("/api/totems/vincular/")).rejects.toThrow(
      "Código de vinculación inválido.",
    );
  });

  it("extrae error por campo con array vacío o vacío", async () => {
    mockResponse({ nombre: [], detalle: "" });
    await expect(apiFetch("/x")).rejects.toThrow("Error 400");
  });

  it("extrae error de non_field_errors", async () => {
    mockResponse({ non_field_errors: ["Credenciales inválidas."] });
    await expect(apiFetch("/x")).rejects.toThrow("Credenciales inválidas.");
  });

  it("prioriza detail por encima de mensajes de campo", async () => {
    mockResponse({
      detail: "No autenticado.",
      codigo_vinculacion: ["Código inválido."],
    });
    await expect(apiFetch("/x")).rejects.toThrow("No autenticado.");
  });

  it("extrae error.message", async () => {
    mockResponse({ message: "Error interno del servidor." }, 500);
    await expect(apiFetch("/x")).rejects.toThrow("Error interno del servidor.");
  });

  it("extrae errores anidados de serializadores", async () => {
    mockResponse({
      plantilla: { nombre: ["Ya existe una plantilla con ese nombre."] },
    });
    await expect(apiFetch("/x")).rejects.toThrow(
      "Ya existe una plantilla con ese nombre.",
    );
  });

  it("usa Error <status> cuando el body no tiene mensaje", async () => {
    mockResponse({}, 400);
    await expect(apiFetch("/x")).rejects.toThrow("Error 400");
  });

  it("usa Error <status> cuando el body no es JSON", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("<html>error</html>", { status: 502 }));
    await expect(apiFetch("/x")).rejects.toThrow("Error 502");
  });
});
