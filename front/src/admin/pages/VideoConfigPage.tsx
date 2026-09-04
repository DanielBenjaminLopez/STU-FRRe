import { useEffect, useState } from "react";
import VideoUpload from "../components/VideoUpload";
import {
  fetchConfigVideo,
  updateConfigVideo,
  type ConfiguracionVideo,
} from "../../shared/api/totems";

export default function VideoConfigPage() {
  const [config, setConfig] = useState<ConfiguracionVideo | null>(null);
  const [intervalo, setIntervalo] = useState(60);
  const [activo, setActivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigVideo()
      .then((c) => {
        setConfig(c);
        setIntervalo(c.intervalo);
        setActivo(c.activo);
      })
      .catch(() => setError("Error al cargar configuración"));
  }, []);

  const handleUploaded = (url: string) => {
    if (config) {
      setConfig({ ...config, video_url: url });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateConfigVideo({ intervalo, activo });
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
            Configurá el video que se muestra en los tótems cuando están
            inactivos.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">
            Archivo de video
          </h2>
          <VideoUpload
            currentUrl={config?.video_url ?? null}
            onUploaded={handleUploaded}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Configuración</h2>

          <div className="space-y-2">
            <label
              htmlFor="intervalo"
              className="block text-sm font-medium text-gray-700"
            >
              Intervalo de inactividad (segundos)
            </label>
            <input
              id="intervalo"
              type="number"
              min={10}
              max={600}
              value={intervalo}
              onChange={(e) => setIntervalo(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">
              Tiempo de inactividad antes de mostrar el video (10-600 segundos).
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
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>

          {saved && (
            <span className="text-sm text-green-600">
              Guardado correctamente
            </span>
          )}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}
