import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { useTotemScale, TOTEM_WIDTH, TOTEM_HEIGHT } from "../useTotemScale";

class MockResizeObserver {
  static lastInstance: MockResizeObserver | null = null;
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    MockResizeObserver.lastInstance = this;
  }
  observe() {}
  unobserve() {}
  disconnect() {
    MockResizeObserver.lastInstance = null;
  }
}

beforeEach(() => {
  MockResizeObserver.lastInstance = null;
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function triggerResize(width: number, height: number) {
  MockResizeObserver.lastInstance?.cb(
    [
      { contentRect: { width, height, top: 0, left: 0, right: 0, bottom: 0 } },
    ] as ResizeObserverEntry[],
    {} as ResizeObserver,
  );
}

function TestComponent({ onScale }: { onScale?: (s: number) => void }) {
  const { containerRef, scale } = useTotemScale();
  onScale?.(scale);
  return (
    <div
      ref={containerRef}
      style={{ width: 800, height: 600 }}
      data-testid="scale-value"
      data-scale={scale}
    />
  );
}

describe("useTotemScale", () => {
  it("exporta las dimensiones del totem", () => {
    expect(TOTEM_WIDTH).toBe(2160);
    expect(TOTEM_HEIGHT).toBe(3840);
  });

  it("retorna un scale inicial", () => {
    const { getByTestId } = render(<TestComponent />);
    const el = getByTestId("scale-value");
    const scale = Number(el.dataset.scale);
    expect(scale).toBeGreaterThan(0);
  });

  it("calcula scale basado en el ancho del contenedor", () => {
    const { getByTestId } = render(<TestComponent />);
    act(() => {
      triggerResize(540, 3000);
    });
    const el = getByTestId("scale-value");
    const scale = Number(el.dataset.scale);
    expect(scale).toBeCloseTo(540 / TOTEM_WIDTH, 2);
  });

  it("calcula scale basado en el alto del contenedor", () => {
    const { getByTestId } = render(<TestComponent />);
    act(() => {
      triggerResize(3000, 960);
    });
    const el = getByTestId("scale-value");
    const scale = Number(el.dataset.scale);
    expect(scale).toBeCloseTo(960 / TOTEM_HEIGHT, 2);
  });

  it("usa el minimo entre ancho y alto", () => {
    const { getByTestId } = render(<TestComponent />);
    act(() => {
      triggerResize(540, 960);
    });
    const el = getByTestId("scale-value");
    const scale = Number(el.dataset.scale);
    const expected = Math.min(540 / TOTEM_WIDTH, 960 / TOTEM_HEIGHT);
    expect(scale).toBeCloseTo(expected, 2);
  });

  it("no actualiza si las dimensiones son 0", () => {
    const { getByTestId } = render(<TestComponent />);
    const el = getByTestId("scale-value");
    const initial = Number(el.dataset.scale);
    act(() => {
      triggerResize(0, 0);
    });
    const updated = Number(getByTestId("scale-value").dataset.scale);
    expect(updated).toBe(initial);
  });
});
