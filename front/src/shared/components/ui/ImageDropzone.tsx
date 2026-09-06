import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export interface ImageDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
}

export default function ImageDropzone({
  value,
  onChange,
  onUpload,
  disabled = false,
}: ImageDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Clean up object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      const preview = URL.createObjectURL(file);
      setLocalPreview(preview);

      if (onUpload) {
        try {
          setUploading(true);
          const uploadedUrl = await onUpload(file);
          onChange(uploadedUrl);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Error al subir la imagen",
          );
          setLocalPreview(null);
        } finally {
          setUploading(false);
        }
      } else {
        // If no onUpload is provided, store preview or pass file name
        onChange(preview);
      }
    },
    [onUpload, onChange],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      disabled: disabled || uploading,
    });

  const displayImage = localPreview || value;

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setError(null);
    onChange("");
  }

  const rejectionError = fileRejections[0]?.errors[0]?.message;

  return (
    <div className="flex flex-col gap-2">
      {displayImage ? (
        <div className="relative rounded-2xl border border-gray-200 overflow-hidden group bg-gray-50">
          <div className="w-full h-44 flex items-center justify-center bg-gray-100/60 overflow-hidden">
            <img
              src={displayImage}
              alt="Vista previa"
              className="w-full h-full object-cover"
              onError={() => {
                setError("No se pudo cargar la imagen previa");
              }}
            />
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2 backdrop-blur-xs">
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth="4"
                  stroke="currentColor"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span className="text-xs font-medium">Subiendo imagen...</span>
            </div>
          )}

          {!uploading && !disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} aria-label="Cambiar imagen" />
                <button
                  type="button"
                  className="px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-xl shadow-md hover:bg-gray-100 transition-colors"
                >
                  Cambiar
                </button>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-xl shadow-md hover:bg-red-700 transition-colors"
                aria-label="Eliminar imagen"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragActive
              ? "border-blue-600 bg-blue-50/50 text-blue-700"
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50 text-gray-600"
          } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} aria-label="Subir imagen" />
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-xs">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive
                ? "Soltá la imagen aquí..."
                : "Hacé clic para seleccionar o arrastrá una imagen"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              PNG, JPG, WebP o GIF (máximo 5MB)
            </p>
          </div>
        </div>
      )}

      {(error || rejectionError) && (
        <span className="text-xs text-red-500 font-medium">
          {error ||
            (rejectionError?.includes("larger")
              ? "La imagen supera el tamaño máximo permitido de 5MB."
              : "Tipo de archivo no permitido. Seleccione una imagen válida.")}
        </span>
      )}
    </div>
  );
}
