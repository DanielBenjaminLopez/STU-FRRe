import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import ImageDropzone from "../ImageDropzone";

describe("ImageDropzone", () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn(
      () => "blob:http://localhost/mock-blob-uuid",
    );
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza el dropzone vacío cuando no hay imagen", () => {
    render(<ImageDropzone value="" onChange={() => {}} />);
    expect(
      screen.getByText("Hacé clic para seleccionar o arrastrá una imagen"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("PNG, JPG, WebP o GIF (máximo 5MB)"),
    ).toBeInTheDocument();
  });

  it("muestra la vista previa cuando hay una imagen asignada", () => {
    render(
      <ImageDropzone
        value="https://example.com/evento.png"
        onChange={() => {}}
      />,
    );
    const img = screen.getByAltText("Vista previa");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/evento.png");
    expect(screen.getByLabelText("Eliminar imagen")).toBeInTheDocument();
  });

  it("llama a onChange('') al hacer clic en eliminar imagen", () => {
    const handleChange = vi.fn();
    render(
      <ImageDropzone
        value="https://example.com/evento.png"
        onChange={handleChange}
      />,
    );

    const deleteBtn = screen.getByLabelText("Eliminar imagen");
    fireEvent.click(deleteBtn);
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("sube el archivo y llama a onChange con la URL obtenida", async () => {
    const handleChange = vi.fn();
    const handleUpload = vi.fn().mockResolvedValue("/media/eventos/test.png");

    render(
      <ImageDropzone
        value=""
        onChange={handleChange}
        onUpload={handleUpload}
      />,
    );

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText("Subir imagen");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleUpload).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("/media/eventos/test.png");
    });
  });

  it("muestra mensaje de error si la subida falla", async () => {
    const handleChange = vi.fn();
    const handleUpload = vi
      .fn()
      .mockRejectedValue(new Error("Error del servidor"));

    render(
      <ImageDropzone
        value=""
        onChange={handleChange}
        onUpload={handleUpload}
      />,
    );

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText("Subir imagen");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
    expect(handleChange).not.toHaveBeenCalled();
  });
});
