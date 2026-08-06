import { useState, useRef } from "react";
import type { CsvImportResult } from "../../shared/api/horariosAdmin";

interface ImportCsvModalProps {
  title: string;
  onClose: () => void;
  onImport: (file: File) => Promise<CsvImportResult>;
  onSuccess: (result: CsvImportResult) => void;
}

export default function ImportCsvModal({
  title,
  onClose,
  onImport,
  onSuccess,
}: ImportCsvModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, selecciona un archivo con extensión .csv");
      setSelectedFile(null);
      return;
    }
    setError("");
    setErrorsList([]);
    setSelectedFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError("");
    setErrorsList([]);

    try {
      const result = await onImport(selectedFile);
      onSuccess(result);
      onClose();
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError(String((err as Error).message));
      } else {
        setError("Error al importar el archivo CSV.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="pb-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />

          {selectedFile ? (
            <div className="flex items-center justify-between p-3.5 bg-gray-50/60 border border-gray-200/80 rounded-2xl transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setError("");
                  setErrorsList([]);
                }}
                disabled={loading}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors shrink-0 text-xs font-semibold"
                title="Quitar archivo"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => !loading && inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-black bg-gray-100/80 scale-[0.99]"
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/50 bg-gray-50/30"
              }`}
            >
              <svg
                className="mx-auto h-6 w-6 text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <p className="text-sm text-gray-600 font-medium">
                Arrastrá y soltá tu archivo CSV
              </p>
              <p className="text-xs text-gray-400 mt-1">
                o hacé click para seleccionarlo
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              <p className="font-semibold">{error}</p>
              {errorsList.length > 0 && (
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {errorsList.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedFile || loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-black rounded-xl transition-colors flex items-center gap-2 ${
                !selectedFile || loading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-800"
              }`}
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {loading ? "Importando..." : "Importar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
