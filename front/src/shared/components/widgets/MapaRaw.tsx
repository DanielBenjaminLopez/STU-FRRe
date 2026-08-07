import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
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
  aula: { base: "#93c5fd", highlight: "#2563eb", label: "Aula" },
  oficina: { base: "#c4b5fd", highlight: "#7c3aed", label: "Oficina" },
  departamento: {
    base: "#5eead4",
    highlight: "#0d9488",
    label: "Departamento",
  },
  secretaria: { base: "#fda4af", highlight: "#e11d48", label: "Secretaría" },
  laboratorio: { base: "#86efac", highlight: "#16a34a", label: "Laboratorio" },
  servicio: { base: "#fdba74", highlight: "#ea580c", label: "Servicio" },
  escaleras: { base: "#a8a29e", highlight: "#57534e", label: "Escaleras" },
  ascensor: { base: "#d6b370", highlight: "#b8860b", label: "Ascensor" },
  baños: { base: "#67e8f9", highlight: "#0891b2", label: "Baños" },
  otro: { base: "#d1d5db", highlight: "#6b7280", label: "Otro" },
};

const DEFAULT_COLOR = { base: "#6b7280", highlight: "#9ca3af", label: "Otro" };

export type FloorKey = "baja" | "primero" | "segundo";

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
  primero: {
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

const SCALE = 1 / 32;
const DEFAULT_HEIGHT = 0.6;
const HEIGHT_OVERRIDES: Record<string, number> = {
  escaleras1: 1.5,
  escaleras2: 1.5,
  escaleras3: 1.5,
  escaleras4: 1.5,
  ascensor1: 1.5,
  baño1: 0.6,
  baño2: 0.6,
  entrada1: 0.2,
};

// === Indicador "Ud. está aquí" ===
const USTED_AQUI_SVG_X = 617.5;
const USTED_AQUI_SVG_Y = 100.25;
const USTED_AQUI_ENABLED = true;
const USTED_AQUI_PIN_COLOR = 0xef4444;

// === Marcador de ID por polígono ===
const ID_MARKER_RADIUS = 14 * SCALE;

interface PolygonData {
  id: string;
  points: string;
  tipo: string;
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

function parsePoints(pointsStr: string): number[] {
  return pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number);
}

function getPolygonCenter(pointsStr: string): { x: number; y: number } {
  const coords = parsePoints(pointsStr);
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

function isStairId(id: string): boolean {
  return id.toLowerCase().includes("escalera");
}

function getSpecialIconUrl(id: string): string | null {
  const lowerId = id.toLowerCase();
  if (lowerId.includes("escalera")) return escalerasUrl;
  if (lowerId.includes("baño") || lowerId.includes("bano")) return wcUrl;
  if (lowerId.includes("ascensor") || lowerId.includes("elevador"))
    return ascensorUrl;
  return null;
}

function pointInPolygon(x: number, y: number, pts: number[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i];
    const yi = pts[i + 1];
    const xj = pts[j];
    const yj = pts[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const STAIR_TREAD = 0.3;
const STAIR_RISE = 0.15;
const STAIR_MIN_STEPS = 3;
const STAIR_MAX_STEPS = 20;

function computeStairSteps(pts: number[]): number {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    minX = Math.min(minX, pts[i]);
    maxX = Math.max(maxX, pts[i]);
    minY = Math.min(minY, pts[i + 1]);
    maxY = Math.max(maxY, pts[i + 1]);
  }
  const alongX = maxX - minX >= maxY - minY;
  const svgLength = alongX ? maxX - minX : maxY - minY;
  return Math.min(
    STAIR_MAX_STEPS,
    Math.max(STAIR_MIN_STEPS, Math.round((svgLength * SCALE) / STAIR_TREAD)),
  );
}

function stairCrossExtent(
  pts: number[],
  alongX: boolean,
  slice: number,
  crossMin: number,
  crossMax: number,
): { min: number; max: number } | null {
  let mn = Infinity;
  let mx = -Infinity;
  const step = 0.5;
  for (let c = crossMin; c <= crossMax; c += step) {
    const x = alongX ? slice : c;
    const y = alongX ? c : slice;
    if (pointInPolygon(x, y, pts)) {
      if (c < mn) mn = c;
      if (c > mx) mx = c;
    }
  }
  return mn === Infinity ? null : { min: mn, max: mx };
}

function buildStaircase(
  polygon: PolygonData,
  bounds: { cx: number; cy: number },
  buildingGroup: THREE.Group,
): THREE.Mesh[] {
  const pts = parsePoints(polygon.points);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    minX = Math.min(minX, pts[i]);
    maxX = Math.max(maxX, pts[i]);
    minY = Math.min(minY, pts[i + 1]);
    maxY = Math.max(maxY, pts[i + 1]);
  }

  const alongX = maxX - minX >= maxY - minY;
  const svgLength = alongX ? maxX - minX : maxY - minY;
  const n = computeStairSteps(pts);
  const tread = svgLength / n;
  const rise = STAIR_RISE;

  const crossMin = alongX ? minY : minX;
  const crossMax = alongX ? maxY : maxX;

  const colors = TYPE_COLORS[polygon.tipo] ?? DEFAULT_COLOR;
  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(colors.base),
    side: THREE.DoubleSide,
  });

  const group = new THREE.Group();
  group.rotation.x = -Math.PI / 2;
  buildingGroup.add(group);

  const meshes: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const t = alongX ? i : n - 1 - i;
    const slice = (alongX ? minX : minY) + (t + 0.5) * tread;
    const extent = stairCrossExtent(pts, alongX, slice, crossMin, crossMax);
    if (!extent) continue;

    const height = (i + 1) * rise;
    const cross = (extent.max - extent.min) * SCALE;
    const x = alongX
      ? (slice - bounds.cx) * SCALE
      : ((extent.min + extent.max) / 2 - bounds.cx) * SCALE;
    const y = alongX
      ? -((extent.min + extent.max) / 2 - bounds.cy) * SCALE
      : -((slice - bounds.cy) * SCALE);

    const geometry = new THREE.BoxGeometry(
      alongX ? tread * SCALE : cross,
      alongX ? cross : tread * SCALE,
      height,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, height / 2);
    mesh.userData = { id: polygon.id, tipo: polygon.tipo };
    group.add(mesh);
    meshes.push(mesh);
  }

  return meshes;
}

function computeBounds(polygons: PolygonData[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of polygons) {
    const pts = parsePoints(p.points);
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i];
      const y = pts[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

function buildIdMarker(
  bounds: { cx: number; cy: number },
  id: string,
  center: { x: number; y: number },
  topHeight: number,
  buildingGroup: THREE.Group,
) {
  const dx = id === "25" ? -25 : 0;
  const dy = id === "25" ? -10 : 0;
  const x = (center.x + dx - bounds.cx) * SCALE;
  const z = (center.y + dy - bounds.cy) * SCALE;
  const y = topHeight + 0.4;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const texture = new THREE.CanvasTexture(canvas);

  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10, 10, 10, 1)";
  ctx.fill();

  const iconUrl = getSpecialIconUrl(id);
  if (iconUrl) {
    const img = new Image();
    img.onload = () => {
      const iconSize = 150;
      ctx.drawImage(
        img,
        128 - iconSize / 2,
        128 - iconSize / 2,
        iconSize,
        iconSize,
      );
      texture.needsUpdate = true;
    };
    img.src = iconUrl;
  } else {
    let fontSize = 120;
    ctx.font = `bold ${fontSize}px Inter`;
    const maxTextWidth = 200;
    const textWidth = ctx.measureText(id).width;
    if (textWidth > maxTextWidth) {
      fontSize = Math.max(
        20,
        Math.floor((fontSize * maxTextWidth) / textWidth),
      );
      ctx.font = `bold ${fontSize}px Inter`;
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(id, 128, 128);
  }

  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const marker = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true }),
  );
  const diameter = ID_MARKER_RADIUS * 2;
  marker.scale.set(diameter, diameter, 1);
  marker.position.set(x, y, z);
  buildingGroup.add(marker);
}

function convexHull(
  points: { x: number; y: number }[],
): { x: number; y: number }[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts;

  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function buildFloorPlane(
  polygons: PolygonData[],
  bounds: {
    maxX: number;
    minX: number;
    maxY: number;
    minY: number;
    cx: number;
    cy: number;
  },
  buildingGroup: THREE.Group,
) {
  const allPoints: { x: number; y: number }[] = [];
  for (const p of polygons) {
    const pts = parsePoints(p.points);
    for (let i = 0; i < pts.length; i += 2) {
      allPoints.push({ x: pts[i], y: pts[i + 1] });
    }
  }
  if (allPoints.length === 0) return;

  const hull = convexHull(allPoints);
  const padding = 40;
  const shape = new THREE.Shape();
  for (let i = 0; i < hull.length; i++) {
    const hx =
      (hull[i].x - bounds.cx) *
      SCALE *
      (1 + padding / (bounds.maxX - bounds.minX || 1));
    const hy =
      -(hull[i].y - bounds.cy) *
      SCALE *
      (1 + padding / (bounds.maxY - bounds.minY || 1));
    if (i === 0) shape.moveTo(hx, hy);
    else shape.lineTo(hx, hy);
  }
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0xeeeeee,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.01;
  buildingGroup.add(mesh);
}

function buildMeshes(
  polygons: PolygonData[],
  bounds: { cx: number; cy: number },
  buildingGroup: THREE.Group,
): Map<string, THREE.Mesh[]> {
  const meshes = new Map<string, THREE.Mesh[]>();

  polygons.forEach((polygon) => {
    if (!polygon.points) return;

    if (isStairId(polygon.id)) {
      meshes.set(polygon.id, buildStaircase(polygon, bounds, buildingGroup));
      const top = computeStairSteps(parsePoints(polygon.points)) * STAIR_RISE;
      buildIdMarker(
        bounds,
        polygon.id,
        getPolygonCenter(polygon.points),
        top,
        buildingGroup,
      );
      return;
    }

    const pts = parsePoints(polygon.points);
    const shape = new THREE.Shape();
    for (let j = 0; j < pts.length; j += 2) {
      const x = (pts[j] - bounds.cx) * SCALE;
      const y = -(pts[j + 1] - bounds.cy) * SCALE;
      if (j === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const depth = HEIGHT_OVERRIDES[polygon.id] ?? DEFAULT_HEIGHT;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
    });

    const colors = TYPE_COLORS[polygon.tipo] ?? DEFAULT_COLOR;
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.base),
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { id: polygon.id, tipo: polygon.tipo };
    buildingGroup.add(mesh);
    meshes.set(polygon.id, [mesh]);

    const edges = new THREE.EdgesGeometry(geometry, 20);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.35,
      }),
    );
    line.rotation.x = -Math.PI / 2;
    buildingGroup.add(line);

    buildIdMarker(
      bounds,
      polygon.id,
      getPolygonCenter(polygon.points),
      depth,
      buildingGroup,
    );
  });

  return meshes;
}

function buildYouAreHerePin(
  bounds: { cx: number; cy: number },
  buildingGroup: THREE.Group,
): THREE.Group {
  const group = new THREE.Group();

  const x = (USTED_AQUI_SVG_X - bounds.cx) * SCALE;
  const z = -(USTED_AQUI_SVG_Y - bounds.cy) * SCALE;

  const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
  const shaftMat = new THREE.MeshPhongMaterial({
    color: USTED_AQUI_PIN_COLOR,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.6;
  group.add(shaft);

  const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const headMat = new THREE.MeshPhongMaterial({
    color: USTED_AQUI_PIN_COLOR,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.35;
  group.add(head);

  const shadowGeo = new THREE.CircleGeometry(0.18, 16);
  const shadowMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.15,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 2000;
  labelCanvas.height = 400;
  const ctx = labelCanvas.getContext("2d")!;
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 320px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ud. está aquí", 1000, 200);

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.anisotropy = 4;
  labelTexture.minFilter = THREE.LinearMipmapLinearFilter;
  labelTexture.magFilter = THREE.LinearFilter;
  const labelMat = new THREE.SpriteMaterial({
    map: labelTexture,
    transparent: true,
    color: USTED_AQUI_PIN_COLOR,
  });
  const label = new THREE.Sprite(labelMat);
  label.scale.set(2.5, 0.5, 1);
  label.position.y = 1.75;
  label.position.z = -0.5;
  group.add(label);

  group.position.set(x, 0, z);
  buildingGroup.add(group);
  return group;
}

export default function MapaRaw({
  initialFloor = "baja",
  compact = false,
}: { initialFloor?: FloorKey; compact?: boolean } = {}) {
  const [floor, setFloor] = useState<FloorKey>(initialFloor);
  const [selectedRoom, setSelectedRoom] = useState<{
    id: string;
    data: RoomData;
  } | null>(null);
  const [searchType, setSearchType] = useState<string>("");
  const [searchPlaceId, setSearchPlaceId] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const meshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const hoveredRef = useRef<THREE.Mesh | null>(null);
  const youAreHereRef = useRef<THREE.Group | null>(null);

  const floorConfig = FLOORS[floor];
  const polygons = useMemo(
    () => parsePolygons(floorConfig.svg, floorConfig.data),
    [floorConfig],
  );

  const bounds = useMemo(() => computeBounds(polygons), [polygons]);

  const buildingSize = useMemo(() => {
    const w = (bounds.maxX - bounds.minX) * SCALE;
    const h = (bounds.maxY - bounds.minY) * SCALE;
    return Math.max(w, h);
  }, [bounds]);

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
    const excludedTypes = new Set(["escaleras", "ascensor"]);
    const typeSet = new Map<string, string>();
    for (const room of allRooms) {
      if (excludedTypes.has(room.data.tipo)) continue;
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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = true;
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2.7;
    if (compact) {
      controls.minPolarAngle = 0.8;
      controls.maxPolarAngle = 0.8;
    }
    controlsRef.current = controls;
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1);
    dir1.position.set(20, 40, 20);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 1);
    dir2.position.set(-20, 10, -20);
    scene.add(dir2);

    const floorPlaneGeo = new THREE.PlaneGeometry(
      buildingSize * 1.3,
      buildingSize * 1.3,
    );
    const floorPlaneMat = new THREE.MeshPhongMaterial({
      color: 0xf0f0f0,
    });
    const floorPlane = new THREE.Mesh(floorPlaneGeo, floorPlaneMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = -0.02;
    // scene.add(floorPlane);

    if (compact) {
      const camDistance = buildingSize * 0.9;
      camera.position.set(0, camDistance * 0.9, camDistance);
      controls.target.set(1, -5, 0);
    } else {
      const camDistance = buildingSize * 1.2;
      camera.position.set(0, camDistance * 0.9, camDistance);
      controls.target.set(1, 0, 0);
    }

    controls.update();

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (buildingGroupRef.current) {
      scene.remove(buildingGroupRef.current);
      buildingGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
        if (child instanceof THREE.Sprite) {
          const mat = child.material as THREE.SpriteMaterial;
          mat.map?.dispose();
          mat.dispose();
        }
      });
    }

    const group = new THREE.Group();
    scene.add(group);
    buildingGroupRef.current = group;

    if (!compact) {
      buildFloorPlane(polygons, bounds, group);
    }

    meshesRef.current = buildMeshes(polygons, bounds, group);

    if (USTED_AQUI_ENABLED && floor === "baja") {
      youAreHereRef.current = buildYouAreHerePin(bounds, group);
    } else {
      youAreHereRef.current = null;
    }
  }, [polygons, bounds, floor, compact]);

  const highlightMesh = useCallback((id: string | null) => {
    meshesRef.current.forEach((meshes) => {
      for (const m of meshes) {
        const colors =
          TYPE_COLORS[(m.userData as { tipo: string }).tipo] ?? DEFAULT_COLOR;
        (m.material as THREE.MeshPhongMaterial).color.set(
          m.userData.id === id
            ? colors.highlight
            : id
              ? "#cccccc"
              : colors.base,
        );
      }
    });
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      highlightMesh(selectedRoom.id);
    }
  }, [selectedRoom, polygons, bounds, floor, highlightMesh]);

  const handleSearchSelect = useCallback(
    (r: { id: string; data: RoomData; floor: FloorKey }) => {
      setSearchPlaceId(r.id);
      setFloor(r.floor);
      const config = FLOORS[r.floor];
      const polys = parsePolygons(config.svg, config.data);
      const poly = polys.find((p) => p.id === r.id);
      if (poly) {
        setSelectedRoom({ id: r.id, data: r.data });
      }
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !cameraRef.current) return;

      if (selectedRoom) {
        hoveredRef.current = null;
        return;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(meshesRef.current.values()).flat(),
      );

      if (hoveredRef.current) {
        const prevTipo = hoveredRef.current.userData.tipo as string;
        const prevColors = TYPE_COLORS[prevTipo] ?? DEFAULT_COLOR;
        (hoveredRef.current.material as THREE.MeshPhongMaterial).color.set(
          prevColors.base,
        );
        hoveredRef.current = null;
      }

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        hoveredRef.current = mesh;
        (mesh.material as THREE.MeshPhongMaterial).color.set(0xdddddd);
      }
    },
    [selectedRoom],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !cameraRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(meshesRef.current.values()).flat(),
      );

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const id = mesh.userData.id as string;
        const roomData = floorConfig.data[id];
        setSearchType("");
        setSearchPlaceId("");
        setSelectedRoom({
          id,
          data: roomData ?? { nombre: id, tipo: "otro", piso: floor },
        });
        highlightMesh(id);
      } else {
        setSelectedRoom(null);
        highlightMesh(null);
      }
    },
    [floorConfig, floor, highlightMesh],
  );

  return (
    <div
      className={`flex grow flex-col items-center justify-center rounded-4xl overflow-visible gap-4`}
    >
      <div className="w-full flex flex-col px-16 gap-4">
        {!compact && (
          <div className="flex gap-2 w-full p-4 min-h-72 h-72 overflow-hidden flex-col bg-white/50 rounded-2xl border border-gray-200">
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
                      setSelectedRoom(null);
                      highlightMesh(null);
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      searchType === ""
                        ? "bg-cyan-200 text-cyan-900"
                        : "bg-white text-black"
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
                        setSelectedRoom(null);
                        highlightMesh(null);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                        searchType === t.value
                          ? "bg-cyan-200 text-cyan-900"
                          : "bg-white text-black"
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
                    {filteredPlaces.map((r, i) => {
                      const colors = TYPE_COLORS[r.data.tipo] ?? DEFAULT_COLOR;
                      return (
                        <button
                          key={`${i}`}
                          onClick={() => handleSearchSelect(r)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                            searchPlaceId === r.id ? "text-white" : "text-black"
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
        )}
        {!compact && (
          <div className="flex flex-row w-full justify-center gap-4 p-4 items-center bg-white/50 rounded-2xl border border-gray-200">
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
                    setSelectedRoom(null);
                    setSearchType("");
                    setSearchPlaceId("");
                    highlightMesh(null);
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
      </div>
      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          className={`w-full cursor-grab active:cursor-grabbing overflow-visible ${compact ? "aspect-4/3" : "aspect-square"}`}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
        />
        {selectedRoom && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-200 p-4 min-w-[200px] flex flex-col items-center">
            <span className="text-xs font-normal text-center text-gray-600">
              Está seleccionando
            </span>
            <div className="font-semibold text-black text-lg">
              {selectedRoom.data.nombre}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    TYPE_COLORS[selectedRoom.data.tipo]?.base ??
                    DEFAULT_COLOR.base,
                }}
              />
              <span className="text-xs text-gray-800">
                {TYPE_COLORS[selectedRoom.data.tipo]?.label ?? "Otro"}
                {" - "}
                {FLOORS[selectedRoom.data.piso as FloorKey]?.label}
              </span>
            </div>
          </div>
        )}
        {!compact && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full px-16">
            <div className="flex flex-wrap gap-3 items-center text-xs border border-gray-200 bg-white/50 rounded-2xl p-4 justify-center">
              {Object.entries(TYPE_COLORS)
                .filter(([key]) => key !== "otro")
                .map(([key, { base, label }]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: base }}
                    />
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
          </div>
        )}
      </div>
    </div>
  );
}
