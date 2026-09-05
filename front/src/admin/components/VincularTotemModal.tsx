import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTotem } from "../../shared/context/TotemContext";
import { vincularTotem } from "../../shared/api/totems";

interface VincularTotemModalProps {
  onClose: () => void;
}

export default function VincularTotemModal({
  onClose,
}: VincularTotemModalProps) {
  const navigate = useNavigate();
  const { refreshTotems, setSelectedId } = useTotem();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const nuevo = await vincularTotem({
        codigo_vinculacion: codigo,
        nombre,
      });
      setSuccess("Tótem vinculado exitosamente");
      setSelectedId(String(nuevo.id));
      refreshTotems().catch(() => {});
      setTimeout(() => {
        onClose();
        navigate("/admin/plantillas", {
          replace: true,
          state: { recienVinculado: true },
        });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al vincular tótem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-4xl shadow-xl w-full max-w-md p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Vincular nuevo tótem
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa el código que figura en la pantalla del tótem para
            vincularlo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Código de vinculación
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Ej: 34735"
              required
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Nombre del tótem
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Ej: Tótem Hall Central"
              required
            />
          </label>

          {error && <span className="text-red-500 text-sm">{error}</span>}
          {success && <span className="text-green-600 text-sm">{success}</span>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 border border-gray-200 rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 border border-gray-900 rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Vinculando..." : "Vincular tótem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
