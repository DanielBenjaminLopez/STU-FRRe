import { useEffect, useState } from "react";
import { useTotem } from "../../shared/context/TotemContext";
import VideoUpload from "../components/VideoUpload";
import Button from "../../shared/components/ui/Button";
import {
  fetchConfigVideo,
  updateConfigVideo,
  type ConfiguracionVideo,
} from "../../shared/api/totems";

export default function VideoConfigPage() {
  const { selectedId, refreshTotems } = useTotem();
  const totemId = selectedId ? Number(selectedId) : null;

  const [config, setConfig] = useState<ConfiguracionVideo | null>(null);
  const [intervalo, setIntervalo] = useState(60);
  const [activo, setActivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!totemId) return;
    fetchConfigVideo(totemId)
      .then((c) => {
        setConfig(c);
        setIntervalo(c.video_intervalo);
        setActivo(c.video_activo);
      })
      .catch(() => setError("Error al cargar configuración"));
  }, [totemId]);

  const handleUploaded = (url: string) => {
    if (config) {
      setConfig({ ...config, video_url: url });
    }
    refreshTotems().catch(() => {});
  };

  const handleSave = async () => {
    if (!totemId) return;
    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      const updated = await updateConfigVideo(totemId, {
        video_intervalo: intervalo,
        video_activo: activo,
      });
      setConfig({
        video_url: updated.video_url,
        video_intervalo: updated.video_intervalo,
        video_activo: updated.video_activo,
      });
      setSuccess("Configuración guardada correctamente");
      setTimeout(() => setSuccess(""), 3000);
      refreshTotems().catch(() => {});
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configurá el video que se muestra en el tótem cuando está inactivo.
          </p>
        </div>

        {totemId && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                Archivo de video
              </h2>
              <VideoUpload
                totemId={totemId}
                currentUrl={config?.video_url ?? null}
                onUploaded={handleUploaded}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                Configuración
              </h2>

              <div className="space-y-2">
                <label
                  htmlFor="intervalo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tiempo de inactividad antes de mostrar el video (segundos)
                </label>
                <input
                  id="intervalo"
                  type="number"
                  min={10}
                  max={600}
                  value={intervalo}
                  onChange={(e) => setIntervalo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                />
                <p className="text-xs text-gray-400">
                  Cuánto esperar sin tocar la pantalla antes de reproducir el
                  video (10-600 segundos).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activo ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activo ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {activo ? "Video activo" : "Video inactivo"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </>
        )}

        {success && (
          <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-600">
            {success}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
