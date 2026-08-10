import { useState } from "react";
import MapaFull from "./MapaFull";
import MapaRaw from "./MapaRaw";

export default function Mapa() {
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      {showFull && <MapaFull onClose={() => setShowFull(false)} />}

      <div className="col-span-2 row-span-2 bg-linear-to-br from-indigo-300/50 to-indigo-300/60 rounded-4xl flex flex-col gap-4 items-center p-8 overflow-hidden">
        <div className="relative w-full flex flex-row gap-2 items-center">
          <span className="text-xl font-semibold">Mapa interactivo</span>
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="shadow-xs absolute top-1/2 -translate-y-1/2 right-0 text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
          >
            Ver mapa
          </button>
        </div>
        <div className="flex items-center justify-center w-full h-full bg-white/50 rounded-4xl pointer-events-none border border-gray-200 overflow-hidden">
          <MapaRaw compact />
        </div>
      </div>
    </>
  );
}
