// import MapaRaw from "./MapaRaw";
import MapaRaw from "./MapaRaw";

export default function MapaFull({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white/70 backdrop-blur-md w-full h-full overflow-hidden rounded-4xl gap-8">
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Mapa interactivo</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="shadow-xs text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
            >
              Cerrar
            </button>
          </div>
        </div>
        {/* <MapaRaw /> */}
        <MapaRaw />
      </div>
    </div>
  );
}
