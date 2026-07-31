import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import svgPlantaBaja from "../../../assets/mapas/planta_baja.svg?raw";
import plantaBajaData from "../../../assets/mapas/planta_baja_data.json";
import svgPrimerPiso from "../../../assets/mapas/primer_piso.svg?raw";
import primerPisoData from "../../../assets/mapas/primer_piso_data.json";
import svgSegundoPiso from "../../../assets/mapas/segundo_piso.svg?raw";
import segundoPisoData from "../../../assets/mapas/segundo_piso_data.json";

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

const SCALE = 1 / 32;
const DEFAULT_HEIGHT = 0.6;
const HEIGHT_OVERRIDES: Record<string, number> = {
  escaleras1: 0.8,
  escaleras2: 0.8,
  ascensor1: 0.8,
  baño1: 0.6,
  baño2: 0.6,
  entrada1: 0.2,
};

// === Indicador "Ud. está aquí" ===
const USTED_AQUI_SVG_X = 617.5;
const USTED_AQUI_SVG_Y = 100.25;
const USTED_AQUI_ENABLED = true;
const USTED_AQUI_PIN_COLOR = 0xef4444;

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

function buildMeshes(
  polygons: PolygonData[],
  bounds: { cx: number; cy: number },
  buildingGroup: THREE.Group,
): Map<string, THREE.Mesh> {
  const meshes = new Map<string, THREE.Mesh>();

  polygons.forEach((polygon) => {
    if (!polygon.points) return;

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
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.base),
      metalness: 0,
      roughness: 1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { id: polygon.id, tipo: polygon.tipo };
    buildingGroup.add(mesh);
    meshes.set(polygon.id, mesh);

    const edges = new THREE.EdgesGeometry(geometry, 20);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.35,
      }),
    );
    line.rotation.x = -Math.PI / 2;
    buildingGroup.add(line);
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
  const shaftMat = new THREE.MeshStandardMaterial({
    color: USTED_AQUI_PIN_COLOR,
    metalness: 0.2,
    roughness: 0.6,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.6;
  group.add(shaft);

  const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: USTED_AQUI_PIN_COLOR,
    metalness: 0.3,
    roughness: 0.5,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.35;
  group.add(head);

  const shadowGeo = new THREE.CircleGeometry(0.18, 16);
  const shadowMat = new THREE.MeshStandardMaterial({
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

export default function MapaRawExperimental({
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
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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
    const floorPlaneMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 1,
    });
    const floorPlane = new THREE.Mesh(floorPlaneGeo, floorPlaneMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = -0.02;
    // scene.add(floorPlane);

    const camDistance = buildingSize * 1.2;
    camera.position.set(0, camDistance * 0.9, camDistance);
    controls.target.set(0, 0, 0);
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
      });
    }

    const group = new THREE.Group();
    scene.add(group);
    buildingGroupRef.current = group;

    meshesRef.current = buildMeshes(polygons, bounds, group);

    if (USTED_AQUI_ENABLED && floor === "baja") {
      youAreHereRef.current = buildYouAreHerePin(bounds, group);
    } else {
      youAreHereRef.current = null;
    }
  }, [polygons, bounds, floor]);

  const highlightMesh = useCallback((id: string | null) => {
    meshesRef.current.forEach((m, key) => {
      const colors =
        TYPE_COLORS[(m.userData as { tipo: string }).tipo] ?? DEFAULT_COLOR;
      (m.material as THREE.MeshStandardMaterial).color.set(
        key === id ? colors.highlight : id ? "#cccccc" : colors.base,
      );
    });
  }, []);

  const handleSearchSelect = useCallback(
    (r: { id: string; data: RoomData; floor: FloorKey }) => {
      setSearchPlaceId(r.id);
      setFloor(r.floor);
      const config = FLOORS[r.floor];
      const polys = parsePolygons(config.svg, config.data);
      const poly = polys.find((p) => p.id === r.id);
      if (poly) {
        setSelectedRoom({ id: r.id, data: r.data });
        highlightMesh(r.id);
      }
    },
    [highlightMesh],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !cameraRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(meshesRef.current.values()),
      );

      if (hoveredRef.current) {
        const prevTipo = hoveredRef.current.userData.tipo as string;
        const prevColors = TYPE_COLORS[prevTipo] ?? DEFAULT_COLOR;
        const prevId = hoveredRef.current.userData.id as string;
        if (prevId !== selectedRoom?.id) {
          (hoveredRef.current.material as THREE.MeshStandardMaterial).color.set(
            prevColors.base,
          );
        }
        hoveredRef.current = null;
      }

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        hoveredRef.current = mesh;
        (mesh.material as THREE.MeshStandardMaterial).color.set(
          mesh.userData.id === selectedRoom?.id
            ? (TYPE_COLORS[mesh.userData.tipo as string] ?? DEFAULT_COLOR)
                .highlight
            : 0xdddddd,
        );
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
        Array.from(meshesRef.current.values()),
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
      className={`flex grow flex-col items-center justify-center rounded-4xl overflow-visible gap-8`}
    >
      {!compact && (
        <div className="flex gap-2 w-full p-4 min-h-72 h-72 overflow-hidden flex-col bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200">
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
                      setSelectedRoom(null);
                      highlightMesh(null);
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
                        onClick={() => handleSearchSelect(r)}
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
      )}
      {!compact && (
        <div className="flex flex-row w-full justify-center gap-4 p-4 items-center bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200">
          <span className="font-normal text-sm">Piso actual</span>
          <div className="flex gap-2">
            {(
              Object.entries(FLOORS) as [FloorKey, (typeof FLOORS)[FloorKey]][]
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
      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          className="w-full aspect-square cursor-grab active:cursor-grabbing overflow-visible"
          onClick={handleClick}
          onPointerMove={handlePointerMove}
        />
        {selectedRoom && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200 p-4 min-w-[200px]">
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
      {!compact && (
        <div className="flex flex-wrap gap-3 items-center text-sm text-gray-700">
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
      )}
    </div>
  );
}
