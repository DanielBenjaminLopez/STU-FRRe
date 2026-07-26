import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTotemScale, TOTEM_WIDTH, TOTEM_HEIGHT } from "../useTotemScale";

let lastObserver: MockResizeObserver | null = null;

class MockResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    lastObserver = this;
  }
  observe() {}
  unobserve() {}
  disconnect() {
    lastObserver = null;
  }
}

beforeEach(() => {
  lastObserver = null;
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function triggerResize(width: number, height: number) {
  lastObserver?.cb(
    [{ contentRect: { width, height, top: 0, left: 0, right: 0, bottom: 0 } }] as ResizeObserverEntry[],
    {} as ResizeObserver,
  );
}

describe("useTotemScale", () => {
  it("exporta las dimensiones del totem", () => {
    expect(TOTEM_WIDTH).toBe(1080);
    expect(TOTEM_HEIGHT).toBe(1920);
  });

  it("retorna un scale inicial", () => {
    const { result } = renderHook(() => useTotemScale());
    expect(result.current.scale).toBeGreaterThan(0);
    expect(result.current.containerRef).toBeDefined();
  });

  it("calcula scale basado en el ancho del contenedor", () => {
    const { result } = renderHook(() => useTotemScale());
    act(() => {
      triggerResize(540, 3000);
    });
    expect(result.current.scale).toBeCloseTo(540 / TOTEM_WIDTH, 2);
  });

  it("calcula scale basado en el alto del contenedor", () => {
    const { result } = renderHook(() => useTotemScale());
    act(() => {
      triggerResize(3000, 960);
    });
    expect(result.current.scale).toBeCloseTo(960 / TOTEM_HEIGHT, 2);
  });

  it("usa el minimo entre ancho y alto", () => {
    const { result } = renderHook(() => useTotemScale());
    act(() => {
      triggerResize(540, 960);
    });
    const expected = Math.min(540 / TOTEM_WIDTH, 960 / TOTEM_HEIGHT);
    expect(result.current.scale).toBeCloseTo(expected, 2);
  });

  it("no actualiza si las dimensiones son 0", () => {
    const { result } = renderHook(() => useTotemScale());
    const initial = result.current.scale;
    act(() => {
      triggerResize(0, 0);
    });
    expect(result.current.scale).toBe(initial);
  });
});
