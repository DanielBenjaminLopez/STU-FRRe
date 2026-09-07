import { useCallback, useRef, useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { deleteVideoArchivo } from "../../shared/api/totems";

interface VideoUploadProps {
  totemId: number;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onDeleted: () => void;
}

const ACCEPTED = "video/mp4,video/webm,video/quicktime";
const MAX_BYTES = 100 * 1024 * 1024;

export default function VideoUpload({
  totemId,
  currentUrl,
  onUploaded,
  onDeleted,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["mp4", "webm", "mov"].includes(ext)) {
        setError("Formato no soportado. Use MP4, WebM o MOV.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("El video no debe superar 100MB.");
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        const token = localStorage.getItem("admin_token");
        const formData = new FormData();
        formData.append("video_archivo", file);

        const xhr = new XMLHttpRequest();
        const result = await new Promise<{ video_url: string }>(
          (resolve, reject) => {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                try {
                  const body = JSON.parse(xhr.responseText);
                  const msg =
                    body?.video_archivo?.[0] ||
                    body?.detail ||
                    `Error ${xhr.status}`;
                  reject(new Error(Array.isArray(msg) ? msg[0] : String(msg)));
                } catch {
                  reject(new Error(`Error ${xhr.status}`));
                }
              }
            };
            xhr.onerror = () => reject(new Error("Error de red"));
            xhr.open("PATCH", `/api/totems/${totemId}/config-video/`);
            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            xhr.send(formData);
          },
        );

        onUploaded(result.video_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir");
      } finally {
        setUploading(false);
      }
    },
    [totemId, onUploaded],
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteVideoArchivo(totemId);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (file) upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-3">
      {currentUrl && !uploading && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <video
              src={currentUrl}
              className="mx-auto aspect-[9/16] object-cover h-64"
              controls
              playsInline
              muted
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="flex items-center gap-1.5 p-1.5 pr-2 text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={deleting ? "Eliminando..." : "Eliminar video"}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Subiendo... {progress}%
          </p>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-600 bg-blue-50/50 text-blue-700"
            : "border-gray-300 hover:border-gray-400 bg-gray-50/50 text-gray-600"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-xs mx-auto">
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-700">
          Arrastrá un video o hacé click para seleccionar
        </p>
        <p className="mt-1 text-xs text-gray-400">
          MP4, WebM o MOV (máximo 100MB)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Eliminar video"
          itemName="el video"
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
