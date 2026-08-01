import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTotemWebSocket } from "../useTotemWebSocket";

type WSCallback = ((...args: unknown[]) => void) | undefined;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: WSCallback;
  onclose: WSCallback;
  onmessage: WSCallback;
  readyState = 0;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  MockWebSocket.instances = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = MockWebSocket;
});

afterEach(() => {
  vi.useRealTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).WebSocket;
});

describe("useTotemWebSocket", () => {
  it("reconecta automáticamente después de una desconexión", () => {
    renderHook(() => useTotemWebSocket("ABC123"));

    const first = MockWebSocket.instances[0];
    act(() => first.simulateOpen());
    expect(first).toHaveProperty("url", expect.stringContaining("ABC123"));

    act(() => first.simulateClose());

    act(() => vi.advanceTimersByTime(3000));

    expect(MockWebSocket.instances).toHaveLength(2);

    const second = MockWebSocket.instances[1];
    act(() => second.simulateOpen());
    expect(second).toHaveProperty("url", expect.stringContaining("ABC123"));
  });

  it("marca rejected tras MAX_RETRIES (5) fallos consecutivos", () => {
    const { result } = renderHook(() => useTotemWebSocket("ABC123"));

    const first = MockWebSocket.instances[0];
    act(() => first.simulateOpen());
    expect(result.current.rejected).toBe(false);

    for (let i = 0; i < 6; i++) {
      act(() => {
        MockWebSocket.instances[
          MockWebSocket.instances.length - 1
        ].simulateClose();
      });
      act(() => vi.advanceTimersByTime(3000));
    }

    expect(MockWebSocket.instances).toHaveLength(6);
    expect(result.current.rejected).toBe(true);
  });

  it("resetea el contador de reintentos tras una conexión exitosa", () => {
    const { result } = renderHook(() => useTotemWebSocket("ABC123"));

    const first = MockWebSocket.instances[0];
    act(() => first.simulateOpen());

    act(() => {
      MockWebSocket.instances[0].simulateClose();
    });
    act(() => vi.advanceTimersByTime(3000));

    const second = MockWebSocket.instances[1];
    act(() => second.simulateOpen());

    act(() => {
      MockWebSocket.instances[1].simulateClose();
    });
    act(() => vi.advanceTimersByTime(3000));

    expect(MockWebSocket.instances).toHaveLength(3);
    expect(result.current.rejected).toBe(false);
  });

  it("no conecta si codigo es null", () => {
    renderHook(() => useTotemWebSocket(null));
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});
