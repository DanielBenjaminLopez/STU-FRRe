import { useCallback, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  uploadHorarioPdf,
  getHorarioPreview,
  confirmHorarioImport,
  type HorarioRow,
  type HorarioPreview,
  type ImportResult,
} from "../../shared/api/horariosPdf";

type Step = "upload" | "preview" | "done";

const DIA_LABELS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
};

function UploadZone({
  onUpload,
  loading,
  error,
}: {
  onUpload: (file: File) => void;
  loading: boolean;
  error: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".pdf")) {
      onUpload(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            Arrastrá un PDF aquí o hacé click para seleccionar
          </p>
          <p className="text-xs text-gray-400">
            Solo archivos .pdf (máx. 20 MB)
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
          Procesando PDF con OCR... esto puede tardar unos segundos.
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 max-w-lg">
          {error}
        </div>
      )}
    </div>
  );
}

function PreviewTable({
  horarios,
  onEdit,
}: {
  horarios: HorarioRow[];
  onEdit: (index: number, field: keyof HorarioRow, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Año
            </th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Curso
            </th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Materia
            </th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">
              Día
            </th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">
              Inicio
            </th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">
              Fin
            </th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Aula
            </th>
          </tr>
        </thead>
        <tbody>
          {horarios.map((h, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2">
                <select
                  value={h.anio}
                  onChange={(e) => onEdit(i, "anio", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white"
                >
                  <option value="primero">1ro</option>
                  <option value="segundo">2do</option>
                  <option value="tercero">3ro</option>
                  <option value="cuarto">4to</option>
                  <option value="quinto">5to</option>
                </select>
              </td>
              <td className="px-3 py-2">
                <input
                  value={h.comision}
                  onChange={(e) => onEdit(i, "comision", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  value={h.materia}
                  onChange={(e) => onEdit(i, "materia", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                />
              </td>
              <td className="px-3 py-2 text-center">
                <select
                  value={h.dia}
                  onChange={(e) => onEdit(i, "dia", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-center"
                >
                  {Object.entries(DIA_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  value={h.hora_inicio}
                  onChange={(e) => onEdit(i, "hora_inicio", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-center"
                  placeholder="HH:MM"
                />
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  value={h.hora_fin}
                  onChange={(e) => onEdit(i, "hora_fin", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-center"
                  placeholder="HH:MM"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  value={h.aula ?? ""}
                  onChange={(e) => onEdit(i, "aula", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                  placeholder="Opcional"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HorariosPdfPage() {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [preview, setPreview] = useState<HorarioPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const result = await uploadHorarioPdf(file);
      setTaskId(result.task_id);

      if (result.errores.length > 0) {
        setError(`Advertencias del OCR:\n${result.errores.join("\n")}`);
      }

      const previewData = await getHorarioPreview(result.task_id);
      setPreview(previewData);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el PDF");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = useCallback(
    (index: number, field: keyof HorarioRow, value: string) => {
      if (!preview) return;
      const updated = [...preview.horarios];
      updated[index] = { ...updated[index], [field]: value };
      setPreview({ ...preview, horarios: updated });
    },
    [preview],
  );

  const handleImport = useCallback(async () => {
    if (!taskId || !preview) return;
    setLoading(true);
    setError("");
    try {
      const result = await confirmHorarioImport(taskId, {
        horarios: preview.horarios,
      });
      setImportResult(result);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  }, [taskId, preview]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setTaskId(null);
    setPreview(null);
    setImportResult(null);
    setError("");
  }, []);

  return (
    <div className="p-8">
      <PageHeader
        title="Cargar horarios desde PDF"
        subtitle="Procesar un PDF de horarios con OCR e importar los datos"
      />

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {step === "upload" && (
        <UploadZone onUpload={handleUpload} loading={loading} error="" />
      )}

      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Se detectaron{" "}
                <span className="font-semibold">
                  {preview.total_horarios} horarios
                </span>{" "}
                en {preview.paginas_procesadas} páginas.
                {preview.carrera && (
                  <span className="ml-2 text-gray-400">
                    ({preview.carrera})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Podés editar los datos antes de importar. Revisá que los nombres
                de materias y comisiones sean correctos.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Importando..." : "Confirmar importación"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <PreviewTable horarios={preview.horarios} onEdit={handleEdit} />
          </div>
        </div>
      )}

      {step === "done" && importResult && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Importación completada</h2>
            <p className="text-sm text-gray-500 mt-1">
              Los datos se importaron correctamente a la base de datos.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="px-4 py-3 bg-gray-50 rounded-2xl">
              <p className="text-2xl font-bold">
                {importResult.horarios_creados}
              </p>
              <p className="text-xs text-gray-500">Horarios</p>
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-2xl">
              <p className="text-2xl font-bold">
                {importResult.materias_creadas}
              </p>
              <p className="text-xs text-gray-500">Materias nuevas</p>
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-2xl">
              <p className="text-2xl font-bold">
                {importResult.comisiones_creadas}
              </p>
              <p className="text-xs text-gray-500">Comisiones nuevas</p>
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-2xl">
              <p className="text-2xl font-bold">
                {importResult.espacios_creados}
              </p>
              <p className="text-xs text-gray-500">Espacios nuevos</p>
            </div>
          </div>
          {importResult.errores && importResult.errores.length > 0 && (
            <div className="w-full max-w-lg px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm text-yellow-700">
              <p className="font-medium mb-1">
                Algunos registros tuvieron problemas:
              </p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {importResult.errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Cargar otro PDF
          </button>
        </div>
      )}
    </div>
  );
}
