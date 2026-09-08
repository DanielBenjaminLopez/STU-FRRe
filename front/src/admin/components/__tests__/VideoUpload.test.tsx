import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import VideoUpload from "../VideoUpload";
import * as totemsApi from "../../../shared/api/totems";

const { mockSileo } = vi.hoisted(() => ({
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

vi.mock("../../../shared/api/totems", () => ({
  deleteVideoArchivo: vi.fn(),
}));

const mockDeleteVideo = vi.mocked(totemsApi.deleteVideoArchivo);

describe("VideoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteVideo.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows sileo.error when file format is unsupported", async () => {
    const onUploaded = vi.fn();
    const onDeleted = vi.fn();

    render(
      <VideoUpload
        totemId={1}
        currentUrl={null}
        onUploaded={onUploaded}
        onDeleted={onDeleted}
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Formato no soportado",
        }),
      );
    });
  });

  it("shows sileo.error when file exceeds max size (100MB)", async () => {
    const onUploaded = vi.fn();
    const onDeleted = vi.fn();

    render(
      <VideoUpload
        totemId={1}
        currentUrl={null}
        onUploaded={onUploaded}
        onDeleted={onDeleted}
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const largeFile = new File(["a"], "big_video.mp4", { type: "video/mp4" });
    Object.defineProperty(largeFile, "size", { value: 101 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Archivo demasiado grande",
        }),
      );
    });
  });

  it("shows sileo.success when deleting video succeeds", async () => {
    const onUploaded = vi.fn();
    const onDeleted = vi.fn();

    render(
      <VideoUpload
        totemId={1}
        currentUrl="http://example.com/video.mp4"
        onUploaded={onUploaded}
        onDeleted={onDeleted}
      />,
    );

    const deleteBtn = screen.getByTitle("Eliminar video");
    fireEvent.click(deleteBtn);

    // Confirm modal opens, click confirm button in modal
    const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" });
    const confirmBtn = deleteButtons[deleteButtons.length - 1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteVideo).toHaveBeenCalledWith(1);
      expect(onDeleted).toHaveBeenCalled();
      expect(mockSileo.success).toHaveBeenCalledWith({
        title: "Video eliminado",
      });
    });
  });

  it("shows sileo.error when deleting video fails", async () => {
    mockDeleteVideo.mockRejectedValue(new Error("Error de red"));
    const onUploaded = vi.fn();
    const onDeleted = vi.fn();

    render(
      <VideoUpload
        totemId={1}
        currentUrl="http://example.com/video.mp4"
        onUploaded={onUploaded}
        onDeleted={onDeleted}
      />,
    );

    const deleteBtn = screen.getByTitle("Eliminar video");
    fireEvent.click(deleteBtn);

    const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" });
    const confirmBtn = deleteButtons[deleteButtons.length - 1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockSileo.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al eliminar el video",
        }),
      );
    });
  });
});
