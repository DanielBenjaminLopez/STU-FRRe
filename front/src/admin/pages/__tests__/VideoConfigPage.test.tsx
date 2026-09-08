import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import VideoConfigPage from "../VideoConfigPage";

const {
  mockSelectedId,
  mockRefreshTotems,
  mockFetchConfigVideo,
  mockUpdateConfigVideo,
  mockSileo,
} = vi.hoisted(() => ({
  mockSelectedId: vi.fn(),
  mockRefreshTotems: vi.fn().mockResolvedValue(undefined),
  mockFetchConfigVideo: vi.fn(),
  mockUpdateConfigVideo: vi.fn(),
  mockSileo: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("sileo", () => ({
  sileo: mockSileo,
}));

vi.mock("../../../shared/context/TotemContext", () => ({
  useTotem: () => ({
    selectedId: mockSelectedId(),
    refreshTotems: mockRefreshTotems,
  }),
}));

vi.mock("../../../shared/api/totems", () => ({
  fetchConfigVideo: mockFetchConfigVideo,
  updateConfigVideo: mockUpdateConfigVideo,
}));

vi.mock("../../components/VideoUpload", () => ({
  default: () => <div data-testid="mock-video-upload" />,
}));

describe("VideoConfigPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders prompt when no totem is selected", () => {
    mockSelectedId.mockReturnValue(null);
    render(<VideoConfigPage />);

    expect(
      screen.getByText(
        /Seleccioná un tótem en la barra superior para configurar su video/i,
      ),
    ).toBeInTheDocument();
  });

  it("loads config and displays interval when totem is selected", async () => {
    mockSelectedId.mockReturnValue("1");
    mockFetchConfigVideo.mockResolvedValue({
      video_url: "http://example.com/video.mp4",
      video_intervalo: 45,
      video_activo: true,
    });

    render(<VideoConfigPage />);

    await waitFor(() => {
      const input = screen.getByLabelText(
        /Tiempo de inactividad/i,
      ) as HTMLInputElement;
      expect(input.value).toBe("45");
    });
  });

  it("calls sileo.error when fetchConfigVideo fails", async () => {
    mockSelectedId.mockReturnValue("1");
    mockFetchConfigVideo.mockRejectedValue(new Error("Network failure"));

    render(<VideoConfigPage />);

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al cargar configuración",
        }),
      );
    });
  });

  it("calls sileo.success when config is saved successfully", async () => {
    mockSelectedId.mockReturnValue("1");
    mockFetchConfigVideo.mockResolvedValue({
      video_url: null,
      video_intervalo: 60,
      video_activo: false,
    });
    mockUpdateConfigVideo.mockResolvedValue({
      video_url: null,
      video_intervalo: 60,
      video_activo: true,
    });

    render(<VideoConfigPage />);

    await waitFor(() => {
      expect(screen.getByText("Guardar")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(mockUpdateConfigVideo).toHaveBeenCalledWith(1, {
        video_intervalo: 60,
        video_activo: false,
      });
      expect(mockSileo.success).toHaveBeenCalledWith({
        title: "Configuración guardada",
      });
    });
  });

  it("calls sileo.error when saving fails", async () => {
    mockSelectedId.mockReturnValue("1");
    mockFetchConfigVideo.mockResolvedValue({
      video_url: null,
      video_intervalo: 60,
      video_activo: false,
    });
    mockUpdateConfigVideo.mockRejectedValue(new Error("Server error"));

    render(<VideoConfigPage />);

    await waitFor(() => {
      expect(screen.getByText("Guardar")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al guardar",
        }),
      );
    });
  });
});
