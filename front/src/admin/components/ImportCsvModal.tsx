import { useState, useRef } from "react";
import Button from "../../shared/components/ui/Button";
import type { CsvImportResult } from "../../shared/api/horariosAdmin";

interface ImportCsvModalProps {
  title: string;
  onClose: () => void;
  onImport: (file: File) => Promise<CsvImportResult>;
  onSuccess: (result: CsvImportResult) => void;
}

function formatErrorText(errorText: string) {
  const parts = errorText.split("'");
  if (parts.length === 1) return errorText;

  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className="font-semibold text-red-700">
              {part}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}

export default function ImportCsvModal({
  title,
  onClose,
  onImport,
  onSuccess,
}: ImportCsvModalProps) {
  const [step, setStep] = useState<"upload" | "summary">("upload");
  const [importResult, setImportResult] = useState<CsvImportResult | null>(
    null,
  );
  const [filterType, setFilterType] = useState<
    "new" | "update" | "skip" | "error" | null
  >(null);
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
      setImportResult(result);
      if (result.totales && result.totales.errores > 0) {
        setFilterType("error");
      } else {
        setFilterType(null);
      }
      setStep("summary");
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

  function handleFinalize() {
    if (importResult) {
      onSuccess(importResult);
    }
    onClose();
  }

  const totales = importResult?.totales || {
    creados: importResult?.creados || 0,
    actualizados: importResult?.actualizados || 0,
    omitidos: 0,
    errores: importResult?.errors?.length || 0,
  };

  const detalles = importResult?.detalles || [];

  const filteredDetalles = detalles.filter((d) => {
    if (totales.errores > 0 && (!filterType || filterType === "error")) {
      return d.tipo === "error" || (d.errores && d.errores.length > 0);
    }
    if (!filterType) return true;
    return d.tipo === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-none border border-gray-200/80 space-y-4 max-h-[90vh] flex flex-col">
        <div className="pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === "summary" ? "Resumen de Importación" : title}
          </h2>
          {step === "summary" && selectedFile && (
            <p className="text-xs text-gray-500 mt-0.5">
              Archivo:{" "}
              <span className="font-medium text-gray-700">
                {selectedFile.name}
              </span>
            </p>
          )}
        </div>

        {step === "upload" ? (
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
                  Arrastrá tu archivo CSV aqui
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
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!selectedFile || loading}
                className="flex items-center gap-2"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {loading ? "Importando..." : "Importar"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
            {/* Píldoras de Estadísticas Interactivas para Filtrar */}
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <button
                type="button"
                onClick={() =>
                  setFilterType(filterType === "new" ? null : "new")
                }
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  filterType === "new"
                    ? "bg-emerald-100 border-emerald-300 ring-2 ring-emerald-400 text-emerald-950 font-semibold"
                    : "bg-emerald-50/80 border-emerald-100 text-emerald-800 hover:bg-emerald-100/60"
                }`}
              >
                <p className="text-xl font-extrabold">{totales.creados}</p>
                <p className="text-xs font-medium opacity-80">Creados</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterType(filterType === "update" ? null : "update")
                }
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  filterType === "update"
                    ? "bg-blue-100 border-blue-300 ring-2 ring-blue-400 text-blue-950 font-semibold"
                    : "bg-blue-50/80 border-blue-100 text-blue-800 hover:bg-blue-100/60"
                }`}
              >
                <p className="text-xl font-extrabold">{totales.actualizados}</p>
                <p className="text-xs font-medium opacity-80">Actualizados</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterType(filterType === "skip" ? null : "skip")
                }
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  filterType === "skip"
                    ? "bg-gray-200 border-gray-400 ring-2 ring-gray-400 text-gray-950 font-semibold"
                    : "bg-gray-50 border-gray-200/70 text-gray-700 hover:bg-gray-100/80"
                }`}
              >
                <p className="text-xl font-extrabold">{totales.omitidos}</p>
                <p className="text-xs font-medium opacity-80">Sin cambios</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterType(filterType === "error" ? null : "error")
                }
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  filterType === "error"
                    ? "bg-red-100 border-red-300 ring-2 ring-red-400 text-red-950 font-semibold"
                    : "bg-red-50/80 border-red-100 text-red-800 hover:bg-red-100/60"
                }`}
              >
                <p className="text-xl font-extrabold">{totales.errores}</p>
                <p className="text-xs font-medium opacity-80">Errores</p>
              </button>
            </div>

            {/* Lista detallada de filas */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {filteredDetalles.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No hay registros en esta categoría.
                </div>
              ) : (
                filteredDetalles.map((item, idx) => {
                  const datos = item.datos || {};
                  const getVal = (...keys: string[]) => {
                    for (const k of keys) {
                      for (const rawKey of Object.keys(datos)) {
                        if (
                          rawKey.toLowerCase().trim() === k.toLowerCase().trim()
                        ) {
                          const val = datos[rawKey];
                          if (
                            val !== undefined &&
                            val !== null &&
                            String(val).trim() !== ""
                          ) {
                            return String(val).trim();
                          }
                        }
                      }
                    }
                    return "";
                  };

                  const materia =
                    getVal("materia", "materia_nombre", "nombre_materia") ||
                    "Fila de archivo";
                  const comision = getVal(
                    "comision_nombre",
                    "nombre_comision",
                    "comision",
                    "curso",
                  );
                  const espacio = getVal("espacio", "aula", "laboratorio");
                  const diaOFecha = getVal("dia_semana", "dia", "día", "fecha");
                  const hInicio = getVal("hora_inicio", "hora_ini", "hora");
                  const hFin = getVal("hora_fin", "hora_final");
                  const horario =
                    hInicio && hFin ? `${hInicio} - ${hFin}` : hInicio;

                  return (
                    <div
                      key={idx}
                      className="p-4.5 bg-white border border-gray-200/90 rounded-2xl flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-gray-400 text-sm shrink-0">
                            #{item.fila}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {materia}
                          </span>
                          {comision && (
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-medium shrink-0">
                              {comision}
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                            item.tipo === "new"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.tipo === "update"
                                ? "bg-blue-100 text-blue-800"
                                : item.tipo === "skip"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-red-100 text-red-700 border border-red-200/60"
                          }`}
                        >
                          {item.tipo === "new"
                            ? "Creado"
                            : item.tipo === "update"
                              ? "Actualizado"
                              : item.tipo === "skip"
                                ? "Sin cambios"
                                : "Error"}
                        </span>
                      </div>

                      <div className="text-gray-600 text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {espacio && (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{espacio}</span>
                          </span>
                        )}

                        {diaOFecha && (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{diaOFecha}</span>
                          </span>
                        )}

                        {horario && (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{horario}</span>
                          </span>
                        )}
                      </div>

                      {item.errores && item.errores.length > 0 && (
                        <div className="mt-0.5 p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-red-600 text-xs leading-relaxed">
                          {item.errores.map((e, eIdx) => (
                            <p key={eIdx}>{formatErrorText(e)}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie de modal */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleFinalize}>
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
