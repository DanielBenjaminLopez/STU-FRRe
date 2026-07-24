import { useMemo, useState } from "react";
import svgPlantaBaja from "../../../assets/mapas/planta_baja.svg?raw";
import plantaBajaData from "../../../assets/mapas/planta_baja_data.json";
import svgPrimerPiso from "../../../assets/mapas/primer_piso.svg?raw";
import primerPisoData from "../../../assets/mapas/primer_piso_data.json";
import svgSegundoPiso from "../../../assets/mapas/segundo_piso.svg?raw";
import segundoPisoData from "../../../assets/mapas/segundo_piso_data.json";

const DEFAULT_FILL = "#C0EEF0";
const HIGHLIGHT_FILL = "#a2dcde";

type FloorKey = "baja" | "primer" | "segundo";

const FLOORS: Record<
  FloorKey,
  {
    label: string;
    svg: string;
    data: Record<string, { nombre: string }>;
    viewBox: string;
  }
> = {
  baja: {
    label: "Planta Baja",
    svg: svgPlantaBaja,
    data: plantaBajaData,
    viewBox: "0 0 851 903",
  },
  primer: {
    label: "Primer Piso",
    svg: svgPrimerPiso,
    data: primerPisoData,
    viewBox: "0 0 862 895",
  },
  segundo: {
    label: "Segundo Piso",
    svg: svgSegundoPiso,
    data: segundoPisoData,
    viewBox: "0 0 621 873",
  },
};

interface PolygonData {
  id: string;
  points: string;
}

function getPolygonCenter(pointsStr: string): { x: number; y: number } {
  const coords = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  let sumX = 0;
  let sumY = 0;
  const numPoints = coords.length / 2;
  for (let i = 0; i < coords.length; i += 2) {
    sumX += coords[i];
    sumY += coords[i + 1];
  }
  return { x: sumX / numPoints, y: sumY / numPoints };
}

function parsePolygons(svg: string): PolygonData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const polygons = doc.querySelectorAll("polygon");
  return Array.from(polygons).map((p) => ({
    id: p.getAttribute("id") ?? "",
    points: p.getAttribute("points") ?? "",
  }));
}

export default function MapaFull({ onClose }: { onClose: () => void }) {
  const [floor, setFloor] = useState<FloorKey>("baja");
  const [selected, setSelected] = useState<number | null>(null);

  const floorConfig = FLOORS[floor];
  const svgContent = floorConfig.svg;
  const polygons = useMemo(() => parsePolygons(svgContent), [svgContent]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white w-full h-full overflow-hidden rounded-4xl p-16 gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Mapa interactivo — {floorConfig.label}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-normal underline text-gray-500 hover:text-gray-700"
          >
            Cerrar
          </button>
        </div>
        <div className="flex gap-2">
          {(
            Object.entries(FLOORS) as [FloorKey, (typeof FLOORS)[FloorKey]][]
          ).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setFloor(key);
                setSelected(null);
              }}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                floor === key
                  ? "bg-cyan-200 text-cyan-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 overflow-auto">
          <svg
            viewBox={floorConfig.viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {polygons.map((polygon, i) => {
              const center = getPolygonCenter(polygon.points);
              return (
                <g key={polygon.id}>
                  <polygon
                    id={polygon.id}
                    points={polygon.points}
                    fill={selected === i ? HIGHLIGHT_FILL : DEFAULT_FILL}
                    stroke="#333333"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors duration-200"
                    onClick={() => setSelected(selected === i ? null : i)}
                  />
                  <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fill="#333"
                    pointerEvents="none"
                    className="select-none"
                  >
                    {floorConfig.data[
                      polygon.id as keyof typeof floorConfig.data
                    ]?.nombre ?? polygon.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
