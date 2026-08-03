import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Carrera } from "../../shared/api/carreras";

const TIPO_LABELS: Record<string, string> = {
  grado: "Grado",
  tecnica: "Tecnicatura",
  posgrado: "Posgrado",
  diplomatura: "Diplomatura",
};

const TIPO_ORDER = ["grado", "tecnica", "posgrado", "diplomatura"];

interface SearchableCarreraProps {
  carreras: Carrera[];
  selectedId: number | "";
  onChange: (id: number | "") => void;
}

export default function SearchableCarrera({
  carreras,
  selectedId,
  onChange,
}: SearchableCarreraProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCarrera = useMemo(
    () => carreras.find((c) => c.id === selectedId),
    [carreras, selectedId],
  );

  const grouped = useMemo(() => {
    const filtered = search
      ? carreras.filter((c) =>
          c.nombre.toLowerCase().includes(search.toLowerCase()),
        )
      : carreras;

    const groups: { tipo: string; items: Carrera[] }[] = [];
    for (const tipo of TIPO_ORDER) {
      const items = filtered.filter((c) => c.tipo === tipo);
      if (items.length > 0) groups.push({ tipo, items });
    }
    return groups;
  }, [carreras, search]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setSearch("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function handleSelect(id: number | "") {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearch("");
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[240px]">
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex items-center gap-2 border rounded-xl text-sm bg-white transition-colors cursor-text ${
          isOpen
            ? "border-gray-300 ring-2 ring-black/5"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <svg
          className="w-4 h-4 text-gray-400 ml-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {selectedCarrera && !isOpen ? (
          <div className="flex items-center gap-2 py-2 pr-2 flex-1 min-w-0">
            <span className="truncate text-gray-900 font-medium">
              {selectedCarrera.nombre}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {TIPO_LABELS[selectedCarrera.tipo] ?? selectedCarrera.tipo}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto text-gray-400 hover:text-gray-600 shrink-0 p-0.5"
              title="Quicker selección"
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
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={
              selectedCarrera ? selectedCarrera.nombre : "Buscar carrera..."
            }
            className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none placeholder:text-gray-400"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect("")}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              selectedId === ""
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Todas las carreras
          </button>

          {grouped.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              No se encontraron carreras
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.tipo}>
              <div className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide bg-gray-50/80 border-t border-gray-100 first:border-t-0">
                {TIPO_LABELS[group.tipo] ?? group.tipo}
              </div>
              {group.items.map((carrera) => (
                <button
                  key={carrera.id}
                  type="button"
                  onClick={() => handleSelect(carrera.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedId === carrera.id
                      ? "bg-gray-100 font-medium text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {carrera.nombre}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
