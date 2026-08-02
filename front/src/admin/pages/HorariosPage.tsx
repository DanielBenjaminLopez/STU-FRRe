import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
  fetchComisionesForSelect,
  fetchEspaciosForSelect,
  type Comision,
} from "../../shared/api/horariosAdmin";
import {
  uploadHorarioPdf,
  getHorarioPreview,
  confirmHorarioImport,
  type HorarioRow,
  type HorarioPreview,
  type ImportResult,
} from "../../shared/api/horariosPdf";
import type { Espacio } from "../../shared/api/totems";

type Tab = "manual" | "pdf";
type PdfStep = "upload" | "preview" | "done";

interface ManualRow {
  _key: number;
  id?: number;
  comision: number | null;
  espacio: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const DIA_LABELS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mie",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sab",
};

let nextKey = 1;

function ManualTab() {
  const [rows, setRows] = useState<ManualRow[]>([]);
  const [originalIds, setOriginalIds] = useState<Set<number>>(new Set());
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [horarios, com, esp] = await Promise.all([
          fetchHorarios(),
          fetchComisionesForSelect(),
          fetchEspaciosForSelect(),
        ]);
        setComisiones(com);
        setEspacios(esp);

        const loaded: ManualRow[] = horarios.map((h) => ({
          _key: nextKey++,
          id: h.id,
          comision: h.comision,
          espacio: h.espacio,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          activo: h.activo,
        }));
        setRows(loaded);
        setOriginalIds(new Set(loaded.filter((r) => r.id).map((r) => r.id!)));
      } catch {
        setError("Error al cargar horarios");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleEdit(_key: number, field: keyof ManualRow, value: unknown) {
    setRows((prev) =>
      prev.map((r) => (r._key === _key ? { ...r, [field]: value } : r)),
    );
  }

  function handleAddRow() {
    setRows((prev) => [
      ...prev,
      {
        _key: nextKey++,
        comision: null,
        espacio: espacios[0]?.id ?? 0,
        dia_semana: "lunes",
        hora_inicio: "07:45",
        hora_fin: "08:30",
        activo: true,
      },
    ]);
  }

  function handleDeleteRow(_key: number) {
    setRows((prev) => prev.filter((r) => r._key !== _key));
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const currentIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));
      const toDelete = [...originalIds].filter((id) => !currentIds.has(id));

      await Promise.all(toDelete.map((id) => deleteHorario(id)));

      const updatedRows = [...rows];

      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];
        const payload = {
          comision: row.comision,
          espacio: row.espacio,
          dia_semana: row.dia_semana,
          hora_inicio: row.hora_inicio,
          hora_fin: row.hora_fin,
          activo: row.activo,
        };

        if (row.id) {
          await updateHorario(row.id, payload);
        } else {
          const created = await createHorario(payload);
          updatedRows[i] = { ...row, id: created.id };
        }
      }

      setRows(updatedRows);
      setOriginalIds(
        new Set(updatedRows.filter((r) => r.id).map((r) => r.id!)),
      );
      setSuccess("Cambios guardados correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [rows, originalIds]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600 py-8">
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
        Cargando horarios...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">{rows.length}</span> horarios
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            + Agregar fila
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Materia / Comision
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Espacio
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">
                  Dia
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">
                  Inicio
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">
                  Fin
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">
                  Activo
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row._key}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <select
                      value={row.comision ?? ""}
                      onChange={(e) =>
                        handleEdit(
                          row._key,
                          "comision",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white"
                    >
                      <option value="">Sin comision</option>
                      {comisiones.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.display_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.espacio}
                      onChange={(e) =>
                        handleEdit(row._key, "espacio", Number(e.target.value))
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white"
                    >
                      {espacios.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={row.dia_semana}
                      onChange={(e) =>
                        handleEdit(row._key, "dia_semana", e.target.value)
                      }
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
                      type="time"
                      value={row.hora_inicio}
                      onChange={(e) =>
                        handleEdit(row._key, "hora_inicio", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-center"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="time"
                      value={row.hora_fin}
                      onChange={(e) =>
                        handleEdit(row._key, "hora_fin", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-center"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.activo}
                      onChange={(e) =>
                        handleEdit(row._key, "activo", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row._key)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar fila"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No hay horarios cargados. Hace click en "+ Agregar fila" para crear
            uno.
          </div>
        )}
      </div>
    </div>
  );
}

function PdfTab() {
  const [step, setStep] = useState<PdfStep>("upload");
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

  const handleAddRow = useCallback(() => {
    if (!preview) return;
    const last = preview.horarios[preview.horarios.length - 1];
    const newRow: HorarioRow = {
      anio: last?.anio ?? "primero",
      comision: last?.comision ?? "",
      materia: last?.materia ?? "",
      dia: "lunes",
      hora_inicio: "07:45",
      hora_fin: "08:30",
      aula: null,
    };
    setPreview({
      ...preview,
      horarios: [...preview.horarios, newRow],
      total_horarios: preview.total_horarios + 1,
    });
  }, [preview]);

  const handleDeleteRow = useCallback(
    (index: number) => {
      if (!preview) return;
      const updated = preview.horarios.filter((_, i) => i !== index);
      setPreview({
        ...preview,
        horarios: updated,
        total_horarios: updated.length,
      });
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
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {step === "upload" && (
        <UploadZone onUpload={handleUpload} loading={loading} />
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
                en {preview.paginas_procesadas} paginas.
                {preview.carrera && (
                  <span className="ml-2 text-gray-400">
                    ({preview.carrera})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Podes editar los datos antes de importar. Revisa que los nombres
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
                {loading ? "Importando..." : "Confirmar importacion"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <PdfPreviewTable
              horarios={preview.horarios}
              onEdit={handleEdit}
              onAddRow={handleAddRow}
              onDeleteRow={handleDeleteRow}
            />
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
            <h2 className="text-lg font-semibold">Importacion completada</h2>
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

function UploadZone({
  onUpload,
  loading,
}: {
  onUpload: (file: File) => void;
  loading: boolean;
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
            Arrastra un PDF aqui o haz click para seleccionar
          </p>
          <p className="text-xs text-gray-400">
            Solo archivos .pdf (max. 20 MB)
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
    </div>
  );
}

function PdfPreviewTable({
  horarios,
  onEdit,
  onAddRow,
  onDeleteRow,
}: {
  horarios: HorarioRow[];
  onEdit: (index: number, field: keyof HorarioRow, value: string) => void;
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Anio
            </th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Curso
            </th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">
              Materia
            </th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">
              Dia
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
            <th className="px-3 py-2 w-10"></th>
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
              <td className="px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={() => onDeleteRow(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Eliminar fila"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar fila
        </button>
      </div>
    </div>
  );
}

export default function HorariosPage() {
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Horarios de cursado</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestion de horarios de materias
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "manual"
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Gestion manual
        </button>
        <button
          type="button"
          onClick={() => setTab("pdf")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "pdf"
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Cargar PDF
        </button>
      </div>

      {tab === "manual" && <ManualTab />}
      {tab === "pdf" && <PdfTab />}
    </div>
  );
}
