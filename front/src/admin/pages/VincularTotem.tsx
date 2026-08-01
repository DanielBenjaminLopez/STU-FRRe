import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTotem } from "../../shared/context/TotemContext";
import {
  fetchEspacios,
  vincularTotem,
  type Espacio,
} from "../../shared/api/totems";

export default function VincularTotem() {
  const navigate = useNavigate();
  const { refreshTotems, setSelectedId } = useTotem();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [espacioId, setEspacioId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEspacios()
      .then(setEspacios)
      .catch(() => setError("Error al cargar espacios"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const nuevo = await vincularTotem({
        codigo_vinculacion: codigo,
        nombre,
        espacio_id: Number(espacioId),
      });
      setSuccess("Tótem vinculado exitosamente");
      setSelectedId(String(nuevo.id));
      refreshTotems().catch(() => {});
      setTimeout(
        () =>
          navigate("/admin/plantillas", {
            replace: true,
            state: { recienVinculado: true },
          }),
        2000,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al vincular tótem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8">Vincular nuevo tótem</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-white p-10 rounded-4xl shadow-lg max-w-120 w-full"
      >
        <label className="flex flex-col gap-1 text-lg">
          Código de vinculación
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-lg"
            placeholder="Ej: 34735"
            required
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-lg">
          Nombre del tótem
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-lg"
            placeholder="Ej: Tótem Hall Central"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-lg">
          Espacio
          <select
            value={espacioId}
            onChange={(e) => setEspacioId(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-lg bg-white"
            required
          >
            <option value="">Seleccionar espacio...</option>
            {espacios.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre} - Piso {esp.piso} ({esp.tipo})
              </option>
            ))}
          </select>
        </label>

        {error && <span className="text-red-500 text-base">{error}</span>}
        {success && <span className="text-green-600 text-base">{success}</span>}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white text-xl font-semibold px-8 py-3 rounded-2xl w-full cursor-pointer disabled:opacity-50"
        >
          {loading ? "Vinculando..." : "Vincular tótem"}
        </button>
      </form>
    </div>
  );
}
