import { useMemo, useState } from "react";
import svgPlantaBaja from "../../../assets/mapas/planta_baja.svg?raw";
import plantaBajaData from "../../../assets/mapas/planta_baja_data.json";
import svgPrimerPiso from "../../../assets/mapas/primer_piso.svg?raw";
import primerPisoData from "../../../assets/mapas/primer_piso_data.json";
import svgSegundoPiso from "../../../assets/mapas/segundo_piso.svg?raw";
import segundoPisoData from "../../../assets/mapas/segundo_piso_data.json";
import escalerasUrl from "../../../assets/escaleras.svg?url";
import ascensorUrl from "../../../assets/ascensor.svg?url";
import wcUrl from "../../../assets/wc.svg?url";

const TYPE_COLORS: Record<
  string,
  { base: string; highlight: string; label: string }
> = {
  aula: { base: "#a0c4ff", highlight: "#3b82f6", label: "Aula" },
  oficina: { base: "#bdb2ff", highlight: "#22c55e", label: "Oficina" },
  departamento: {
    base: "#ffc6ff",
    highlight: "#f15bb5",
    label: "Departamento",
  },
  secretaria: { base: "#ffadad", highlight: "#ef476f", label: "Secretaría" },
  laboratorio: { base: "#caffbf", highlight: "#06d6a0", label: "Laboratorio" },
  servicio: { base: "#ffd6a5", highlight: "#ffbe0b", label: "Servicio" },
  otro: { base: "#cccccc", highlight: "#9ca3af", label: "Otro" },
};

const DEFAULT_COLOR = { base: "#6b7280", highlight: "#9ca3af", label: "Otro" };

type FloorKey = "baja" | "primer" | "segundo";

type RoomData = {
  nombre: string;
  tipo: string;
  piso: string;
};

const FLOORS: Record<
  FloorKey,
  {
    label: string;
    svg: string;
    data: Record<string, RoomData>;
    viewBox: string;
  }
> = {
  baja: {
    label: "Planta Baja",
    svg: svgPlantaBaja,
    data: plantaBajaData as Record<string, RoomData>,
    viewBox: "0 0 851 903",
  },
  primer: {
    label: "Primer Piso",
    svg: svgPrimerPiso,
    data: primerPisoData as Record<string, RoomData>,
    viewBox: "0 0 862 895",
  },
  segundo: {
    label: "Segundo Piso",
    svg: svgSegundoPiso,
    data: segundoPisoData as Record<string, RoomData>,
    viewBox: "0 0 621 873",
  },
};

interface PolygonData {
  id: string;
  points: string;
  tipo: string;
}

function getPolygonCenter(pointsStr: string): { x: number; y: number } {
  const coords = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const n = coords.length / 2;
  if (n < 3) {
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < coords.length; i += 2) {
      sumX += coords[i];
      sumY += coords[i + 1];
    }
    return { x: sumX / n, y: sumY / n };
  }
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coords[i * 2];
    const yi = coords[i * 2 + 1];
    const xj = coords[j * 2];
    const yj = coords[j * 2 + 1];
    const cross = xi * yj - xj * yi;
    area += cross;
    cx += (xi + xj) * cross;
    cy += (yi + yj) * cross;
  }
  area *= 0.5;
  if (area === 0) {
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < coords.length; i += 2) {
      sumX += coords[i];
      sumY += coords[i + 1];
    }
    return { x: sumX / n, y: sumY / n };
  }
  cx /= 6 * area;
  cy /= 6 * area;
  return { x: cx, y: cy };
}

function parsePolygons(
  svg: string,
  floorData: Record<string, RoomData>,
): PolygonData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const polygons = doc.querySelectorAll("polygon");
  return Array.from(polygons).map((p) => {
    const id = p.getAttribute("id") ?? "";
    return {
      id,
      points: p.getAttribute("points") ?? "",
      tipo: floorData[id]?.tipo ?? "otro",
    };
  });
}

function getSpecialType(
  id: string,
): "escalera" | "baño" | "ascensor" | "entrada" | null {
  const lowerId = id.toLowerCase();
  if (lowerId.includes("escalera")) return "escalera";
  if (lowerId.includes("baño") || lowerId.includes("bano")) return "baño";
  if (lowerId.includes("ascensor") || lowerId.includes("elevador"))
    return "ascensor";
  if (lowerId.includes("entrada")) return "entrada";
  return null;
}

function SpecialSymbol({
  type,
  center,
  size,
}: {
  type: "escalera" | "baño" | "ascensor";
  center: { x: number; y: number };
  size: number;
}) {
  const urlMap = {
    escalera: escalerasUrl,
    ascensor: ascensorUrl,
    baño: wcUrl,
  };
  const href = urlMap[type];
  if (!href) return null;

  return (
    <image
      x={center.x - size / 2}
      y={center.y - size / 2}
      width={size}
      height={size}
      href={href}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function EntranceSymbol({
  center,
  size,
}: {
  center: { x: number; y: number };
  size: number;
}) {
  const radius = size * 1.2;
  const labelX = center.x - radius * 2;
  const labelY = center.y + radius + 6;
  return (
    <g>
      <circle
        cx={center.x}
        cy={center.y}
        r={radius * 0.8}
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1"
      />
      {/* <circle cx={center.x} cy={center.y} r={radius * 0.4} fill="white" /> */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="start"
        dominantBaseline="central"
        fontSize="13"
        fill="#ef4444"
        fontWeight="bold"
        pointerEvents="none"
        className="select-none"
      >
        Ud. está aquí
      </text>
    </g>
  );
}

function Legend() {
  const types = Object.entries(TYPE_COLORS).filter(([key]) => key !== "otro");
  return (
    <div className="flex flex-wrap gap-3 items-center text-sm text-gray-700">
      {types.map(([key, { base, label }]) => (
        <div key={key} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: base }} />
          <span>{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: TYPE_COLORS.otro.base }}
        />
        <span>{TYPE_COLORS.otro.label}</span>
      </div>
    </div>
  );
}

export default function MapaFull({ onClose }: { onClose: () => void }) {
  const [floor, setFloor] = useState<FloorKey>("baja");
  const [selected, setSelected] = useState<number | null>(null);

  const floorConfig = FLOORS[floor];
  const svgContent = floorConfig.svg;
  const polygons = useMemo(
    () => parsePolygons(svgContent, floorConfig.data),
    [svgContent, floorConfig.data],
  );

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
        <div className="flex grow flex-col items-center justify-center p-8 rounded-4xl gap-8 bg-gray-100/50">
          <div className="flex grow">
            <svg
              viewBox={floorConfig.viewBox}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {polygons.map((polygon, i) => {
                const center = getPolygonCenter(polygon.points);
                const colors = TYPE_COLORS[polygon.tipo] ?? DEFAULT_COLOR;
                const radius = 14;
                const specialType = getSpecialType(polygon.id);
                const isEntrance = specialType === "entrada";
                return (
                  <g key={polygon.id}>
                    {!isEntrance && (
                      <polygon
                        id={polygon.id}
                        points={polygon.points}
                        fill={selected === i ? colors.highlight : colors.base}
                        stroke="#333333"
                        strokeWidth="1"
                        className="cursor-pointer transition-colors duration-200"
                        onClick={() => setSelected(selected === i ? null : i)}
                      />
                    )}
                    {isEntrance ? (
                      <EntranceSymbol center={center} size={radius} />
                    ) : specialType ? (
                      <>
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r={radius}
                          fill="#333333"
                          pointerEvents="none"
                        />
                        <SpecialSymbol
                          type={specialType}
                          center={center}
                          size={radius}
                        />
                      </>
                    ) : (
                      <>
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r={radius}
                          fill="#333333"
                          pointerEvents="none"
                        />
                        <text
                          x={center.x}
                          y={center.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="12"
                          fill="white"
                          pointerEvents="none"
                          className="select-none"
                          fontWeight="bold"
                        >
                          {polygon.id}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <Legend />
        </div>
      </div>
    </div>
  );
}
