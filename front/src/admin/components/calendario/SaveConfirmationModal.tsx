interface SaveConfirmationModalProps {
  open: boolean;
  eventCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SaveConfirmationModal({
  open,
  eventCount,
  onConfirm,
  onCancel,
}: SaveConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-4xl shadow-xl max-w-sm w-full p-8 mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Guardar calendario
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Se guardarán{" "}
          <span className="font-semibold text-slate-700">{eventCount}</span>{" "}
          eventos. Esto reemplazará todos los eventos del calendario existentes.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
