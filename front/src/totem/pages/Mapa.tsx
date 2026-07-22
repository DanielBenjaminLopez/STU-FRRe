import { useState } from "react";
import { useNavigate } from "react-router";
import svgRaw from "../../assets/mapas/planta_baja.svg?raw";
import plantaBajaData from "../../assets/mapas/planta_baja_data.json";

const DEFAULT_FILL = "#C0EEF0";
const HIGHLIGHT_FILL = "#a2dcde";

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

const POLYGONS = parsePolygons(svgRaw);

export default function CampusMap() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col max-w-270 max-h-480 h-480 mx-auto border-x border-gray-200 p-16 gap-8 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Planta Baja</h1>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Volver
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <svg
          viewBox="0 0 903 851"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {POLYGONS.map((polygon, i) => {
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
                  {plantaBajaData[polygon.id as keyof typeof plantaBajaData]
                    ?.nombre ?? polygon.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
