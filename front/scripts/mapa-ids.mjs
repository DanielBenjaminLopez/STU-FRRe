#!/usr/bin/env node
/**
 * Sincronizador de IDs de polígonos del mapa SVG hacia el manifiesto del backend.
 *
 * Uso:
 *   npm run mapa:ids
 *
 * Lee los 3 planos SVG de src/features/mapa/assets/, ignora comentarios XML,
 * extrae los atributos `id` de cada `<polygon>` y escribe
 * `back/api/mapa_polygon_ids.json`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = resolve(dirname(currentFile), "..");
const assetsDir = join(root, "src", "features", "mapa", "assets");
const manifestPath = resolve(
    root,
    "..",
    "back",
    "api",
    "mapa_polygon_ids.json",
);

export const FLOORS = [
    { key: "baja", file: "planta_baja.svg" },
    { key: "primero", file: "primer_piso.svg" },
    { key: "segundo", file: "segundo_piso.svg" },
];

export function extractPolygonIds(svgRaw) {
    const withoutComments = svgRaw.replace(/<!--[\s\S]*?-->/g, "");
    const ids = [];
    const polygonTagRegex = /<polygon\b[^>]*>/gi;
    for (const [tag] of withoutComments.matchAll(polygonTagRegex)) {
        const idMatch = tag.match(/\bid\s*=\s*["']([^"']+)["']/i);
        if (idMatch && idMatch[1]) {
            ids.push(idMatch[1]);
        }
    }
    return ids;
}

export function buildManifestFromAssets() {
    const manifest = {};
    for (const { key, file } of FLOORS) {
        const svgPath = join(assetsDir, file);
        const svgRaw = readFileSync(svgPath, "utf8");
        manifest[key] = extractPolygonIds(svgRaw);
    }
    return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
    const manifest = buildManifestFromAssets();
    writeFileSync(
        manifestPath,
        JSON.stringify(manifest, null, 2) + "\n",
        "utf8",
    );
    console.log(
        `✔ Manifiesto actualizado en back/api/mapa_polygon_ids.json (${Object.entries(
            manifest,
        )
            .map(([k, v]) => `${k}: ${v.length}`)
            .join(", ")})`,
    );
}
