import Button from "../Button";

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
          <Button variant="ghost" size="md" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={onConfirm}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
