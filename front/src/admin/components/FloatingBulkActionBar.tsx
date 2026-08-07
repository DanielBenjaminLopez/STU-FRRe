interface FloatingBulkActionBarProps {
  selectedCount: number;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onClearSelection: () => void;
}

export default function FloatingBulkActionBar({
  selectedCount,
  onToggleStatus,
  onDelete,
  onClearSelection,
}: FloatingBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center bg-black text-white border border-gray-800 shadow-none rounded-2xl p-2 gap-3 transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Cantidad Seleccionada */}
      <div className="px-3 py-1.5 text-sm font-semibold text-blue-400 shrink-0 flex items-center gap-2 pr-4 border-r border-gray-800">
        <span>{selectedCount} seleccionados</span>
      </div>

      {/* Cambiar Estado */}
      {onToggleStatus && (
        <button
          type="button"
          onClick={onToggleStatus}
          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 rounded-xl transition-all cursor-pointer border border-transparent hover:border-gray-800"
          title="Cambiar estado de los seleccionados"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>Estado</span>
        </button>
      )}

      {/* Eliminar Seleccionados */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-white hover:text-red-400 hover:bg-gray-900 rounded-xl transition-all cursor-pointer border border-transparent hover:border-gray-800"
          title="Eliminar seleccionados"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>Eliminar</span>
        </button>
      )}

      {/* Desmarcar Selección */}
      <div>
        <button
          type="button"
          onClick={onClearSelection}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition-colors cursor-pointer"
          title="Desmarcar todo"
        >
          <svg
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
