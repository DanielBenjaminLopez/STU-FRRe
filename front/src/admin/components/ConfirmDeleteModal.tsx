interface ConfirmDeleteModalProps {
  title: string;
  itemName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  title,
  itemName,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  async function handleConfirm() {
    await onConfirm();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-4xl shadow-xl w-full max-w-sm p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">
            ¿Estás seguro de que deseas eliminar <strong>{itemName}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 border border-gray-200 rounded-2xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 border border-red-500 hover:border-red-600 rounded-2xl transition-colors cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
