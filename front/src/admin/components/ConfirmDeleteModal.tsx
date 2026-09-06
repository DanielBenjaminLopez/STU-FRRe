import Button from "../../shared/components/ui/Button";

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
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
