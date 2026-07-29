import { useEffect, useMemo, useRef, useState } from "react";
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
  oficina: { base: "#bdb2ff", highlight: "#6d5dc7", label: "Oficina" },
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

export type FloorKey = "baja" | "primer" | "segundo";

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

export default function MapaRaw({
  initialFloor = "baja",
  compact = false,
}: { initialFloor?: FloorKey; compact?: boolean } = {}) {
  const [floor, setFloor] = useState<FloorKey>(initialFloor);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{
    id: string;
    data: RoomData;
    center: { x: number; y: number };
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  const [searchType, setSearchType] = useState<string>("");
  const [searchPlaceId, setSearchPlaceId] = useState<string>("");

  const allRooms = useMemo(() => {
    const rooms: { id: string; data: RoomData; floor: FloorKey }[] = [];
    for (const [floorKey, config] of Object.entries(FLOORS) as [
      FloorKey,
      (typeof FLOORS)[FloorKey],
    ][]) {
      for (const [id, data] of Object.entries(config.data)) {
        rooms.push({ id, data, floor: floorKey });
      }
    }
    return rooms;
  }, []);

  const availableTypes = useMemo(() => {
    const typeSet = new Map<string, string>();
    for (const room of allRooms) {
      const color = TYPE_COLORS[room.data.tipo];
      if (color && !typeSet.has(room.data.tipo)) {
        typeSet.set(room.data.tipo, color.label);
      }
    }
    return Array.from(typeSet.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [allRooms]);

  const filteredPlaces = useMemo(() => {
    if (!searchType) return [];
    return allRooms
      .filter((r) => r.data.tipo === searchType)
      .sort((a, b) => a.data.nombre.localeCompare(b.data.nombre));
  }, [allRooms, searchType]);

  const floorConfig = FLOORS[floor];
  const svgContent = floorConfig.svg;
  const polygons = useMemo(
    () => parsePolygons(svgContent, floorConfig.data),
    [svgContent, floorConfig.data],
  );

  const handlePolygonClick = (index: number, polygon: PolygonData) => {
    setSearchType("");
    setSearchPlaceId("");
    if (selected === index) {
      setSelected(null);
      setSelectedRoom(null);
    } else {
      const center = getPolygonCenter(polygon.points);
      const roomData = floorConfig.data[polygon.id];
      setSelected(index);
      setSelectedRoom({
        id: polygon.id,
        data: roomData ?? { nombre: polygon.id, tipo: "otro", piso: floor },
        center,
      });
    }
  };

  useEffect(() => {
    if (!svgRef.current || !selectedRoom) return;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = selectedRoom.center.x;
    point.y = selectedRoom.center.y;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const screenPoint = point.matrixTransform(ctm);
    const containerRect = svg.parentElement?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltipPos({
      left: screenPoint.x - containerRect.left,
      top: screenPoint.y - containerRect.top,
    });
  }, [selectedRoom]);

  return (
    <div
      className={`flex grow flex-col items-center justify-center rounded-4xl bg-gray-100/50 ${
        compact ? "p-0" : "p-8 gap-8"
      }`}
    >
      {!compact && (
        <>
          <div className="flex gap-2 w-full bg-white p-4 rounded-2xl min-h-72 h-72 overflow-hidden flex-col">
            <span className="text-center font-medium">Busqueda</span>
            <div className="flex gap-4 overflow-hidden">
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-sm font-medium text-gray-500 text-center">
                  Seleccioná un tipo
                </span>
                <div className="grid grid-cols-2 gap-2 justify-center">
                  <button
                    onClick={() => {
                      setSearchType("");
                      setSearchPlaceId("");
                      setSelected(null);
                      setSelectedRoom(null);
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      searchType === ""
                        ? "bg-cyan-200 text-cyan-900"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Todos
                  </button>
                  {availableTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        setSearchType(t.value);
                        setSearchPlaceId("");
                        setSelected(null);
                        setSelectedRoom(null);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                        searchType === t.value
                          ? "bg-cyan-200 text-cyan-900"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-sm font-medium text-gray-500 text-center">
                  Seleccioná una ubicación
                </span>
                {searchType ? (
                  <div className="flex flex-col gap-2 overflow-auto">
                    {filteredPlaces.map((r) => {
                      const colors = TYPE_COLORS[r.data.tipo] ?? DEFAULT_COLOR;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSearchPlaceId(r.id);
                            setFloor(r.floor);
                            const config = FLOORS[r.floor];
                            const polys = parsePolygons(
                              config.svg,
                              config.data,
                            );
                            const polyIndex = polys.findIndex(
                              (p) => p.id === r.id,
                            );
                            if (polyIndex !== -1) {
                              const poly = polys[polyIndex];
                              const center = getPolygonCenter(poly.points);
                              setSelected(polyIndex);
                              setSelectedRoom({
                                id: r.id,
                                data: r.data,
                                center,
                              });
                            }
                          }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                            searchPlaceId === r.id
                              ? "text-white"
                              : "text-gray-700 hover:opacity-80"
                          }`}
                          style={{
                            backgroundColor:
                              searchPlaceId === r.id
                                ? colors.highlight
                                : colors.base,
                          }}
                        >
                          {r.data.nombre}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-sm text-gray-400">
                    Elegí un tipo primero
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="flex flex-col justify-center items-center relative w-full h-full gap-4">
        {!compact && (
          <div className="flex flex-row gap-4 bg-white p-4 rounded-2xl items-center">
            <span className="font-normal text-sm">Piso actual</span>
            <div className="flex gap-2">
              {(
                Object.entries(FLOORS) as [
                  FloorKey,
                  (typeof FLOORS)[FloorKey],
                ][]
              ).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setFloor(key);
                    setSelected(null);
                    setSelectedRoom(null);
                    setSearchType("");
                    setSearchPlaceId("");
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
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={floorConfig.viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full ${compact ? "aspect-4/3" : "aspect-square"}`}
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
                    className={
                      compact
                        ? "transition-colors duration-200"
                        : "cursor-pointer transition-colors duration-200"
                    }
                    onClick={
                      compact ? undefined : () => handlePolygonClick(i, polygon)
                    }
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
                      cx={center.x + (polygon.id === "25" ? -25 : 0)}
                      cy={center.y + (polygon.id === "25" ? -10 : 0)}
                      r={radius}
                      fill="#333333"
                      pointerEvents="none"
                    />
                    <text
                      x={center.x + (polygon.id === "25" ? -25 : 0)}
                      y={center.y + (polygon.id === "25" ? -10 : 0)}
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
        {!compact && selectedRoom && (
          <div
            className="absolute bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 p-4 min-w-[200px] z-10 pointer-events-none"
            style={{
              left: `${tooltipPos.left}px`,
              top: `${tooltipPos.top}px`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div className="font-semibold text-gray-900 text-lg">
              {selectedRoom.data.nombre}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    TYPE_COLORS[selectedRoom.data.tipo]?.base ??
                    DEFAULT_COLOR.base,
                }}
              />
              <span className="text-sm text-gray-600">
                {TYPE_COLORS[selectedRoom.data.tipo]?.label ?? "Otro"}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Piso:{" "}
              {FLOORS[selectedRoom.data.piso as FloorKey]?.label ??
                selectedRoom.data.piso}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ID: {selectedRoom.id}
            </div>
          </div>
        )}
      </div>
      {!compact && <Legend />}
    </div>
  );
}
