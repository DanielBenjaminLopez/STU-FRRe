import { useState } from "react";
import { DIAS_SEMANA } from "../../shared/api/horariosAdmin";

export interface PreviewRow {
  anio: string;
  comision: string;
  materia: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  aula: string | null;
}

interface PreviewTableProps {
  fileName: string;
  totalHorarios: number;
  totalPaginas: number;
  carreras?: string[];
  rows: PreviewRow[];
  onConfirm: (rows: PreviewRow[]) => void;
  onCancel: () => void;
}

const ANIO_OPTIONS = [
  { value: "primero", label: "1ro" },
  { value: "segundo", label: "2do" },
  { value: "tercero", label: "3ro" },
  { value: "cuarto", label: "4to" },
  { value: "quinto", label: "5to" },
];

export default function PreviewTable({
  fileName,
  totalHorarios,
  totalPaginas,
  rows: initialRows,
  onConfirm,
  onCancel,
}: PreviewTableProps) {
  const [rows, setRows] = useState<PreviewRow[]>(initialRows);

  function updateRow(index: number, field: keyof PreviewRow, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Se detectaron{" "}
          <span className="font-semibold">{totalHorarios} horarios</span> en{" "}
          {totalPaginas} páginas.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {fileName} — Podés modificar las filas antes de confirmar.
        </p>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="px-3 py-2 text-left font-medium">Materia</th>
              <th className="px-3 py-2 text-left font-medium">Comisión</th>
              <th className="px-3 py-2 text-left font-medium">Año</th>
              <th className="px-3 py-2 text-left font-medium">Día</th>
              <th className="px-3 py-2 text-left font-medium">Inicio</th>
              <th className="px-3 py-2 text-left font-medium">Fin</th>
              <th className="px-3 py-2 text-left font-medium">Aula</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-1.5">
                  <input
                    value={row.materia}
                    onChange={(e) => updateRow(i, "materia", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    value={row.comision}
                    onChange={(e) => updateRow(i, "comision", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={row.anio}
                    onChange={(e) => updateRow(i, "anio", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black/10"
                  >
                    {ANIO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={row.dia}
                    onChange={(e) => updateRow(i, "dia", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black/10"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="time"
                    step="300"
                    value={row.hora_inicio}
                    onChange={(e) =>
                      updateRow(i, "hora_inicio", e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="time"
                    step="300"
                    value={row.hora_fin}
                    onChange={(e) => updateRow(i, "hora_fin", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    value={row.aula ?? ""}
                    onChange={(e) => updateRow(i, "aula", e.target.value || "")}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                    placeholder="-"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-gray-400 hover:text-red-500"
                    title="Eliminar fila"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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

      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onConfirm(rows)}
          className="px-5 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
        >
          Confirmar importación ({rows.length} horarios)
        </button>
      </div>
    </div>
  );
}
