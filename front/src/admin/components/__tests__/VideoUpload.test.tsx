import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import VideoUpload from "../VideoUpload";

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

describe("VideoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows sileo.error when file format is unsupported", async () => {
    const onUploaded = vi.fn();

    render(
      <VideoUpload totemId={1} currentUrl={null} onUploaded={onUploaded} />,
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

    render(
      <VideoUpload totemId={1} currentUrl={null} onUploaded={onUploaded} />,
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
});
