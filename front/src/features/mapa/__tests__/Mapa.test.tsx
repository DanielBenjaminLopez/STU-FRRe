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
    }
  });
});

describe("MapaRaw helpers", () => {
  it("parsePolygons ignora polígonos comentados y asigna tipo 'otro' como fallback", () => {
    const sampleSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <!-- <polygon id="entrada1" points="0,0 10,0 10,10"></polygon> -->
        <polygon id="1" points="0,0 5,0 5,5"></polygon>
        <polygon id="sn1" points="1,1 2,1 2,2"></polygon>
      </svg>
    `;
    const result = parsePolygons(sampleSvg, {
      "1": { nombre: "Decanato", tipo: "oficina", piso: "baja" },
    });

    expect(result).toEqual([
      { id: "1", points: "0,0 5,0 5,5", tipo: "oficina" },
      { id: "sn1", points: "1,1 2,1 2,2", tipo: "otro" },
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

  it("shouldShowIdMarker oculta IDs internos en el tótem y los muestra en Admin", () => {
    expect(shouldShowIdMarker("1", "oficina", false)).toBe(true);
    expect(shouldShowIdMarker("68", "servicio", false)).toBe(true);
    expect(shouldShowIdMarker("baño1", "baños", false)).toBe(true);
    expect(shouldShowIdMarker("escaleras1", "escaleras", false)).toBe(true);
    expect(shouldShowIdMarker("ascensor1", "ascensor", false)).toBe(true);

    expect(shouldShowIdMarker("sn1", "otro", false)).toBe(false);
    expect(shouldShowIdMarker("terraza", "otro", false)).toBe(false);

    expect(shouldShowIdMarker("sn1", "otro", true)).toBe(true);
    expect(shouldShowIdMarker("terraza", "otro", true)).toBe(true);
  });
});
