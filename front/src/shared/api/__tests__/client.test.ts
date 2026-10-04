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

  it("reutiliza la caché en memoria para peticiones GET repetidas y expone peekApiCache", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ id: 1 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock;

    const first = await apiFetch("/api/test-cache/");
    const second = await apiFetch("/api/test-cache/");

    expect(first).toEqual([{ id: 1 }]);
    expect(second).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("invalida la caché automáticamente al realizar una mutación", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock;

    await apiFetch("/api/items/");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await apiFetch("/api/items/", { method: "POST", body: "{}" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await apiFetch("/api/items/");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("respeta cache: no-store omitiendo la caché en memoria", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock;

    await apiFetch("/api/no-store/", { cache: "no-store" });
    await apiFetch("/api/no-store/", { cache: "no-store" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
