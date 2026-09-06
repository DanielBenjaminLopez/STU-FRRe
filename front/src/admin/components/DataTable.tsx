import { useState } from "react";
import SearchInput from "../../shared/components/ui/SearchInput";

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
  searchPlaceholder?: string;
  label?: string;
  hideCount?: boolean;
}

export default function DataTable<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  isLoading,
  searchPlaceholder = "Buscar...",
  label = "elementos",
  hideCount = false,
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
      <div
        className={`flex items-center ${hideCount ? "justify-end" : "justify-between"}`}
      >
        {!hideCount && (
          <span className="text-sm text-gray-500">
            {filtered.length} {label}
          </span>
        )}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100">
              {columns.map((col) => {
                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                      ? "text-right"
                      : "text-left";
                const justifyClass =
                  col.align === "center"
                    ? "justify-center"
                    : col.align === "right"
                      ? "justify-end"
                      : "justify-start";
                return (
                  <th
                    key={String(col.key)}
                    className={`px-4 py-3 ${alignClass} font-semibold text-gray-600 ${col.sortable !== false ? "cursor-pointer select-none hover:text-gray-900" : ""}`}
                    onClick={() =>
                      col.sortable !== false ? handleSort(col.key) : undefined
                    }
                  >
                    <span className={`flex items-center gap-1 ${justifyClass}`}>
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-xs">
                          {sortDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
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
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      <div
                        className={`h-4 bg-gray-100 rounded-xl animate-pulse w-3/4 ${
                          col.align === "center"
                            ? "mx-auto"
                            : col.align === "right"
                              ? "ml-auto"
                              : ""
                        }`}
                      />
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
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
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
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : ""
                      }`}
                    >
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
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
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
