import { useState } from "react";
import { TURNOS } from "../../shared/api/mesasExamen";
import Button from "./Button";

export interface MesaExamenPreviewRow {
  materia: string;
  espacio: string;
  fecha: string;
  hora: string;
  turno: string;
  llamado: number;
  tribunal: string;
}

interface MesaExamenPreviewTableProps {
  fileName: string;
  totalMesas: number;
  totalPaginas: number;
  rows: MesaExamenPreviewRow[];
  onConfirm: (rows: MesaExamenPreviewRow[]) => void;
  onCancel: () => void;
}

export default function MesaExamenPreviewTable({
  fileName,
  totalMesas,
  totalPaginas,
  rows: initialRows,
  onConfirm,
  onCancel,
}: MesaExamenPreviewTableProps) {
  const [rows, setRows] = useState<MesaExamenPreviewRow[]>(initialRows);

  function updateRow(
    index: number,
    field: keyof MesaExamenPreviewRow,
    value: string | number,
  ) {
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
          <span className="font-semibold">{totalMesas} mesas de examen</span> en{" "}
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
              <th className="px-3 py-2 text-left font-medium">Espacio</th>
              <th className="px-3 py-2 text-left font-medium">Fecha</th>
              <th className="px-3 py-2 text-left font-medium">Hora</th>
              <th className="px-3 py-2 text-left font-medium">Turno</th>
              <th className="px-3 py-2 text-left font-medium">Llamado</th>
              <th className="px-3 py-2 text-left font-medium">Tribunal</th>
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
                    value={row.espacio}
                    onChange={(e) => updateRow(i, "espacio", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                    placeholder="-"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="date"
                    value={row.fecha}
                    onChange={(e) => updateRow(i, "fecha", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="time"
                    step="300"
                    value={row.hora}
                    onChange={(e) => updateRow(i, "hora", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={row.turno}
                    onChange={(e) => updateRow(i, "turno", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black/10"
                  >
                    {TURNOS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min={1}
                    value={row.llamado}
                    onChange={(e) =>
                      updateRow(i, "llamado", Number(e.target.value))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    value={row.tribunal}
                    onChange={(e) => updateRow(i, "tribunal", e.target.value)}
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
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" size="md" onClick={() => onConfirm(rows)}>
          Confirmar importación ({rows.length} mesas)
        </Button>
      </div>
    </div>
  );
}
