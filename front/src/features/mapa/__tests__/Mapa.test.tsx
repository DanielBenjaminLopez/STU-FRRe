import { describe, it, expect } from "vitest";
import manifest from "../../../../../back/api/mapa_polygon_ids.json";
import svgPlantaBaja from "../assets/planta_baja.svg?raw";
import svgPrimerPiso from "../assets/primer_piso.svg?raw";
import svgSegundoPiso from "../assets/segundo_piso.svg?raw";
import {
  parsePolygons,
  shouldShowIdMarker,
  filterRoomsByPolygons,
  type FloorKey,
} from "../components/MapaRaw";

describe("Contrato SVG ↔ Manifiesto (mapa_polygon_ids.json)", () => {
  it("los polígonos de los 3 SVGs coinciden exactamente con back/api/mapa_polygon_ids.json", () => {
    const typedManifest = manifest as Record<FloorKey, string[]>;

    const svgsByFloor: Record<FloorKey, string> = {
      baja: svgPlantaBaja,
      primero: svgPrimerPiso,
      segundo: svgSegundoPiso,
    };

    for (const [piso, svg] of Object.entries(svgsByFloor) as [
      FloorKey,
      string,
    ][]) {
      const svgIds = parsePolygons(svg, {}).map((p) => p.id);
      expect(
        svgIds,
        `El SVG de '${piso}' divergió de back/api/mapa_polygon_ids.json. Ejecutá 'npm run mapa:ids' en front/ para regenerar el manifiesto.`,
      ).toEqual(typedManifest[piso]);
      for (const id of svgIds) {
        expect(id).toMatch(/^\d+$/);
      }
    }
  });
});

describe("MapaRaw helpers", () => {
  it("parsePolygons ignora polígonos comentados y asigna tipo 'otro' como fallback", () => {
    const sampleSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <!-- <polygon id="999" points="0,0 10,0 10,10"></polygon> -->
        <polygon id="1" points="0,0 5,0 5,5"></polygon>
        <polygon id="69" points="1,1 2,1 2,2"></polygon>
      </svg>
    `;
    const result = parsePolygons(sampleSvg, {
      "1": { nombre: "Decanato", tipo: "oficina", piso: "baja" },
    });

    expect(result).toEqual([
      { id: "1", points: "0,0 5,0 5,5", tipo: "oficina" },
      { id: "69", points: "1,1 2,1 2,2", tipo: "otro" },
    ]);
  });

  it("filterRoomsByPolygons excluye registros de BD que no existen en el SVG del piso", () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg"><polygon id="1" points="0,0 5,0 5,5"/></svg>`;
    const emptySvg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;

    const rooms = filterRoomsByPolygons({
      baja: {
        label: "Planta Baja",
        svg: sampleSvg,
        viewBox: "0 0 10 10",
        data: {
          "1": { nombre: "Decanato", tipo: "oficina", piso: "baja" },
          "36": { nombre: "Huérfano", tipo: "otro", piso: "baja" },
        },
      },
      primero: {
        label: "Primer Piso",
        svg: emptySvg,
        viewBox: "0 0 10 10",
        data: {},
      },
      segundo: {
        label: "Segundo Piso",
        svg: emptySvg,
        viewBox: "0 0 10 10",
        data: {},
      },
    });

    expect(rooms).toEqual([
      {
        id: "1",
        data: { nombre: "Decanato", tipo: "oficina", piso: "baja" },
        floor: "baja",
      },
    ]);
  });

  it("shouldShowIdMarker muestra marcadores para números (1..89) e íconos especiales", () => {
    expect(shouldShowIdMarker("1", "oficina", false)).toBe(true);
    expect(shouldShowIdMarker("68", "servicio", false)).toBe(true);
    expect(shouldShowIdMarker("69", "otro", false)).toBe(true);
    expect(shouldShowIdMarker("74", "otro", false)).toBe(true);
    expect(shouldShowIdMarker("79", "baños", false)).toBe(true);
    expect(shouldShowIdMarker("75", "escaleras", false)).toBe(true);
    expect(shouldShowIdMarker("78", "ascensor", false)).toBe(true);

    expect(shouldShowIdMarker("texto_no_numerico", "otro", false)).toBe(false);
    expect(shouldShowIdMarker("texto_no_numerico", "otro", true)).toBe(true);
  });
});
