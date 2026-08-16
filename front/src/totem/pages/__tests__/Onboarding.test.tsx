import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import Onboarding from "../Onboarding";
import { createTotem, fetchTotemMe } from "../../../shared/api/totems";
import { useTotemWebSocket } from "../../../shared/hooks/useTotemWebSocket";

vi.mock("../../../shared/api/totems", () => ({
  createTotem: vi.fn(),
  fetchTotemMe: vi.fn(),
}));

vi.mock("../../../shared/hooks/useTotemWebSocket", () => ({
  useTotemWebSocket: vi.fn(),
}));

const mockCreateTotem = vi.mocked(createTotem);
const mockUseTotemWebSocket = vi.mocked(useTotemWebSocket);

const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/api/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/client")>();
  return {
    ...actual,
    setTotemToken: vi.fn(),
    clearTotemToken: vi.fn(),
  };
});

function setupWs(
  overrides: { lastMessage?: unknown; rejected?: boolean } = {},
) {
  mockUseTotemWebSocket.mockReturnValue({
    lastMessage: (overrides.lastMessage ?? null) as {
      type: string;
      [key: string]: unknown;
    } | null,
    isConnected: false,
    rejected: overrides.rejected ?? false,
  });
}

describe("Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(fetchTotemMe).mockRejectedValue(new Error("no token"));
  });

  afterEach(() => {
    cleanup();
  });

  it("muestra el botón Regenerar código cuando hay un código", async () => {
    setupWs();
    mockCreateTotem.mockResolvedValue({ codigo_vinculacion: "XYZ789" });

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText("XYZ789")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /regenerar código/i }),
    ).toBeInTheDocument();
  });

  it("regenera el código al hacer clic en Regenerar código", async () => {
    setupWs();
    mockCreateTotem
      .mockResolvedValueOnce({ codigo_vinculacion: "OLD111" })
      .mockResolvedValueOnce({ codigo_vinculacion: "NEW222" });

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText("OLD111")).toBeInTheDocument();
    });

    const btn = screen.getByRole("button", { name: /regenerar código/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("NEW222")).toBeInTheDocument();
    });

    expect(mockCreateTotem).toHaveBeenCalledTimes(2);
  });

  it("muestra error y Reintentar cuando createTotem falla", async () => {
    setupWs();
    mockCreateTotem.mockRejectedValue(new Error("fail"));

    render(<Onboarding />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /reintentar/i }),
      ).toBeInTheDocument();
    });
  });
});
