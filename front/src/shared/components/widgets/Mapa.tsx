import { useState } from "react";
import MapaFull from "./MapaFull";
import svgPlantaBaja from "../../../assets/mapas/planta_baja.svg";

export default function Mapa() {
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      {showFull && <MapaFull onClose={() => setShowFull(false)} />}

      <div className="col-span-2 row-span-2 bg-linear-to-br from-brown-100 to-brown-200 rounded-4xl flex flex-col gap-4 items-center p-8 overflow-hidden">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-3xl font-semibold">Mapa interactivo</span>
          <span className="text-2xl font-normal">
            ¿No sabes donde ir? Averigualo acá
          </span>
        </div>
        <div className="flex items-center justify-center w-full h-full bg-white/70 rounded-2xl p-4">
          <img
            src={svgPlantaBaja}
            alt="Planta Baja"
            className="w-3/4 opacity-75"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="text-sm font-normal underline"
        >
          Ir al mapa
        </button>
      </div>
    </>
  );
}
