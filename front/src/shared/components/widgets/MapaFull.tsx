// import MapaRaw from "./MapaRaw";
import MapaRaw from "./MapaRaw";

export default function MapaFull({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white/70 backdrop-blur-md w-full h-full overflow-hidden rounded-4xl py-16 gap-8">
        <div className="flex items-center justify-between px-16">
          <h1 className="text-xl font-semibold">Mapa interactivo</h1>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-normal underline text-gray-500 hover:text-gray-700"
          >
            Cerrar
          </button>
        </div>
        {/* <MapaRaw /> */}
        <MapaRaw />
      </div>
    </div>
  );
}
