import { useEffect, useState } from "react";
import { sileo } from "sileo";
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

  useEffect(() => {
    if (!totemId) return;
    fetchConfigVideo(totemId)
      .then((c) => {
        setConfig(c);
        setIntervalo(c.video_intervalo);
        setActivo(c.video_activo);
      })
      .catch((err) => {
        sileo.error({
          title: "Error al cargar configuración",
          description:
            err instanceof Error
              ? err.message
              : "No se pudo obtener la configuración de video",
        });
      });
  }, [totemId]);

  const handleUploaded = (url: string) => {
    if (config) {
      setConfig({ ...config, video_url: url });
    }
    refreshTotems().catch(() => {});
  };

  const handleDeleted = () => {
    if (config) {
      setConfig({ ...config, video_url: null });
    }
    refreshTotems().catch(() => {});
  };

  const handleIntervaloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!Number.isFinite(val)) return;
    setIntervalo(val);
  };

  const handleIntervaloBlur = () => {
    setIntervalo((prev) => Math.min(600, Math.max(10, prev)));
  };

  const handleSave = async () => {
    if (!totemId) return;
    if (intervalo < 10 || intervalo > 600) {
      sileo.error({
        title: "Error de validación",
        description: "El intervalo debe estar entre 10 y 600 segundos",
      });
      return;
    }
    setSaving(true);
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
      sileo.success({ title: "Configuración guardada" });
      refreshTotems().catch(() => {});
    } catch (err) {
      sileo.error({
        title: "Error al guardar",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo guardar la configuración de video",
      });
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

        {!totemId && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Seleccioná un tótem en la barra superior para configurar su video.
          </div>
        )}

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
                onDeleted={handleDeleted}
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
                  onChange={handleIntervaloChange}
                  onBlur={handleIntervaloBlur}
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    activo ? "bg-[#101828]" : "bg-gray-300"
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
              <Button
                onClick={handleSave}
                disabled={saving || intervalo < 10 || intervalo > 600}
              >
                Guardar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
