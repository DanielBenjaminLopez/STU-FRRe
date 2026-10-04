import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import Button from "../../shared/components/ui/Button";
import type { CsvImportResult } from "../../features/horarios/api/horariosAdmin";
import { modalBackdropVariants, modalPanelVariants } from "./modalMotion";

interface ImportCsvModalProps {
  title: string;
  onClose: () => void;
  onImport: (file: File) => Promise<CsvImportResult>;
  onSuccess: (result: CsvImportResult) => void;
}

type FilterCategory = "all" | "new" | "update" | "skip" | "error";

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

function getDatumValue(
  datos: Record<string, unknown> | undefined,
  ...keys: string[]
): string {
  if (!datos) return "";
  for (const k of keys) {
    const target = k.toLowerCase().trim();
    for (const rawKey of Object.keys(datos)) {
      if (rawKey.toLowerCase().trim() === target) {
        const val = datos[rawKey];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim();
        }
      }
    }
  }
  return "";
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
  const [filterType, setFilterType] = useState<FilterCategory>("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape" || loading) return;
      if (step === "summary" && importResult) {
        onSuccess(importResult);
      }
      onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, step, importResult, onSuccess, onClose]);

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, selecciona un archivo con extensión .csv");
      setSelectedFile(null);
      return;
    }
    setError("");
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

    try {
      const result = await onImport(selectedFile);
      setImportResult(result);
      if (result.totales && result.totales.errores > 0) {
        setFilterType("error");
      } else {
        setFilterType("all");
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

  const detalles = useMemo(
    () => importResult?.detalles || [],
    [importResult?.detalles],
  );

  const filteredDetalles = useMemo(() => {
    if (filterType === "all") return detalles;
    if (filterType === "error") {
      return detalles.filter(
        (d) => d.tipo === "error" || (d.errores && d.errores.length > 0),
      );
    }
    return detalles.filter((d) => d.tipo === filterType);
  }, [detalles, filterType]);

  const filterPills: {
    id: FilterCategory;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { id: "all", label: "Todos", count: detalles.length },
    {
      id: "new",
      label: "Creados",
      count: totales.creados,
      dotColor: "bg-emerald-500",
    },
    {
      id: "update",
      label: "Actualizados",
      count: totales.actualizados,
      dotColor: "bg-blue-500",
    },
    {
      id: "skip",
      label: "Sin cambios",
      count: totales.omitidos,
      dotColor: "bg-gray-400",
    },
    {
      id: "error",
      label: "Errores",
      count: totales.errores,
      dotColor: "bg-red-500",
    },
  ];

  return (
    <motion.div
      variants={modalBackdropVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target !== e.currentTarget || loading) return;
        if (step === "summary") {
          handleFinalize();
        } else {
          onClose();
        }
      }}
    >
      <motion.div
        variants={modalPanelVariants}
        className={`bg-white rounded-4xl shadow-xl w-full ${
          step === "summary" ? "max-w-3xl" : "max-w-lg"
        } p-8 flex flex-col gap-5 max-h-[90vh] overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === "summary" ? "Resumen de Importación" : title}
            </h2>
            {step === "summary" && selectedFile && (
              <p className="text-xs text-gray-500 mt-1">
                Archivo:{" "}
                <span className="font-medium text-gray-700">
                  {selectedFile.name}
                </span>
              </p>
            )}
          </div>
        </div>

        {step === "upload" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />

            {selectedFile ? (
              <div className="flex items-center justify-between p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
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
                  }}
                  disabled={loading}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors shrink-0 text-xs font-semibold cursor-pointer"
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
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
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
                <p className="text-sm text-gray-700 font-medium">
                  Arrastrá tu archivo CSV aquí
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  o hacé clic para seleccionarlo
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                <p className="font-semibold">{error}</p>
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
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Píldoras de filtro estilo Admin */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {filterPills.map((pill) => {
                const active = filterType === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() =>
                      setFilterType(
                        active && pill.id !== "all" ? "all" : pill.id,
                      )
                    }
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-[#101828] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
                    }`}
                  >
                    {pill.dotColor && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${pill.dotColor}`}
                      />
                    )}
                    <span>{pill.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tabla / lista compacta de registros */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-200 bg-white">
              <div
                key={filterType}
                className="animate-fade-in divide-y divide-gray-100"
              >
                {filteredDetalles.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    No hay registros en esta categoría.
                  </div>
                ) : (
                  filteredDetalles.map((item, idx) => {
                    const datos = item.datos;
                    const carrera = getDatumValue(
                      datos,
                      "carrera_codigo",
                      "codigo_carrera",
                      "carrera",
                    );
                    const materia =
                      getDatumValue(
                        datos,
                        "materia",
                        "materia_nombre",
                        "nombre_materia",
                      ) || "Fila de archivo";
                    const comision = getDatumValue(
                      datos,
                      "comision_nombre",
                      "nombre_comision",
                      "comision",
                      "curso",
                    );
                    const espacio = getDatumValue(
                      datos,
                      "espacio",
                      "aula",
                      "laboratorio",
                    );
                    const diaOFecha = getDatumValue(
                      datos,
                      "dia_semana",
                      "dia",
                      "día",
                      "fecha",
                    );
                    const hInicio = getDatumValue(
                      datos,
                      "hora_inicio",
                      "hora_ini",
                      "hora",
                    );
                    const hFin = getDatumValue(datos, "hora_fin", "hora_final");
                    const horario =
                      hInicio && hFin ? `${hInicio} - ${hFin}` : hInicio;

                    return (
                      <div
                        key={idx}
                        className="px-4 py-3 hover:bg-gray-50/60 transition-colors flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-xs font-medium text-gray-400 tabular-nums w-9 shrink-0">
                              #{item.fila}
                            </span>
                            {carrera && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 shrink-0">
                                {carrera}
                              </span>
                            )}
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {materia}
                            </span>
                            {comision && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                {comision}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {(diaOFecha || horario) && (
                              <span className="text-xs text-gray-500 tabular-nums hidden sm:inline">
                                {[diaOFecha, horario]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}

                            {espacio && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                {espacio}
                              </span>
                            )}

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.tipo === "new"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : item.tipo === "update"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                    : item.tipo === "skip"
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-red-50 text-red-700 border border-red-200/60"
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
                        </div>

                        {item.errores && item.errores.length > 0 && (
                          <div className="ml-11 px-3 py-2 bg-red-50/70 border border-red-200/80 rounded-xl text-red-600 text-xs leading-relaxed">
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
            </div>

            {/* Pie de modal */}
            <div className="flex items-center justify-end pt-1 shrink-0">
              <Button variant="primary" onClick={handleFinalize}>
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
