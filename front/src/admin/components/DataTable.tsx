import { useState } from "react";

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
  searchPlaceholder?: string;
  label?: string;
}

export default function DataTable<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  isLoading,
  searchPlaceholder = "Buscar...",
  label = "elementos",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = data.filter((row) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return columns.some((col) => {
      const val = row[col.key];
      return String(val).toLowerCase().includes(lower);
    });
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const cmp = String(aVal).localeCompare(String(bVal), "es");
    return sortDir === "asc" ? cmp : -cmp;
  });

  function handleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {filtered.length} {label}
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="border border-gray-200 rounded-2xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-gray-600 ${col.sortable !== false ? "cursor-pointer select-none hover:text-gray-900" : ""}`}
                  onClick={() =>
                    col.sortable !== false ? handleSort(col.key) : undefined
                  }
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-xs">
                        {sortDir === "asc" ? "\u2191" : "\u2193"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right font-semibold text-gray-600 w-24">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-gray-100">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded-xl animate-pulse w-3/4" />
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded-xl animate-pulse w-16 ml-auto" />
                    </td>
                  )}
                </tr>
              ))}

            {!isLoading && sorted.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No se encontraron {label}
                </td>
              </tr>
            )}

            {!isLoading &&
              sorted.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
                          >
                            Editar
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
