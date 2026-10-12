#!/usr/bin/env node
/**
 * Generador de features.
 *
 * Uso:
 *   npm run feature:add                 (pregunta el nombre)
 *   npm run feature:add -- mi-widget    (nombre por argumento)
 *   npm run feature:add -- mi-widget --no-register   (no toca registry.ts)
 *
 * Crea src/features/<kebab>/ con api (mock), hooks, components (versión
 * chica + Full), index.ts y tests, y registra el widget en widgets/registry.ts.
 * También agrega el widget a back/api/widgets_manifest.json; el backend lo
 * crea en la BD al arrancar (comando sync_widgets, idempotente), sin migraciones
 * por widget. Sin esa fila las plantillas no pueden guardar el widget.
 */
import { createInterface } from "node:readline/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const featuresDir = join(root, "src", "features");
const registryPath = join(featuresDir, "widgets", "registry.ts");

const args = process.argv.slice(2);
const noRegister = args.includes("--no-register");
let rawName = args.filter((a) => !a.startsWith("--")).join(" ") || undefined;

if (!rawName) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rawName = await rl.question("Nombre del componente (ej: Biblioteca): ");
    rl.close();
}

const words = (rawName ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-zA-Z0-9]+|(?<=[a-z0-9])(?=[A-Z])/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

if (words.length === 0 || /^\d/.test(words[0])) {
    console.error("Nombre inválido: usá letras y que no empiece con número.");
    process.exit(1);
}

const cap = (w) => w[0].toUpperCase() + w.slice(1);
const kebab = words.join("-");
const camel = words[0] + words.slice(1).map(cap).join("");
const Pascal = words.map(cap).join("");
const Label = words.map(cap).join(" ");

const dir = join(featuresDir, kebab);
if (existsSync(dir)) {
    console.error(`Ya existe src/features/${kebab}`);
    process.exit(1);
}

const files = {
    [`api/${camel}.ts`]: `// MOCK: reemplazar por totemFetch/apiFetch + un endpoint en
// shared/api/endpoints.ts cuando exista el backend.
// import { totemFetch } from "../../../shared/api/client";

export interface ${Pascal}Item {
  id: number;
  titulo: string;
  descripcion: string;
}

const MOCK_DATA: ${Pascal}Item[] = [
  { id: 1, titulo: "Elemento de ejemplo 1", descripcion: "Descripción mockeada" },
  { id: 2, titulo: "Elemento de ejemplo 2", descripcion: "Descripción mockeada" },
  { id: 3, titulo: "Elemento de ejemplo 3", descripcion: "Descripción mockeada" },
];

export async function fetch${Pascal}(): Promise<${Pascal}Item[]> {
  // return totemFetch<${Pascal}Item[]>(API_ENDPOINTS.${camel});
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_DATA;
}
`,
    [`hooks/use${Pascal}.ts`]: `import { useEffect, useState } from "react";
import type { ${Pascal}Item } from "../api/${camel}";
import { fetch${Pascal} } from "../api/${camel}";

export function use${Pascal}(enabled = true) {
  const [items, setItems] = useState<${Pascal}Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    fetch${Pascal}()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .catch((e) => {
        if (mounted)
          setError(e instanceof Error ? e.message : "Error al cargar datos");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { items, loading, error };
}
`,
    [`components/${Pascal}.tsx`]: `import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { use${Pascal} } from "../hooks/use${Pascal}";
import ${Pascal}Full from "./${Pascal}Full";
import VerButton from "../../../shared/components/ui/VerButton";
import { useOnTotemReset } from "../../../shared/context/TotemResetContext";

export default function ${Pascal}() {
  const { items, loading, error } = use${Pascal}();
  const [showFull, setShowFull] = useState(false);
  useOnTotemReset(() => setShowFull(false));

  return (
    <>
      <AnimatePresence>
        {showFull && (
          <${Pascal}Full
            onClose={() => setShowFull(false)}
            items={items}
            loading={loading}
            error={error}
          />
        )}
      </AnimatePresence>
      <div className="w-full h-full col-span-4 row-span-2 bg-linear-to-b from-gray-300/50 to-gray-300/60 rounded-4xl flex flex-col gap-4 items-center p-8">
        <div className="flex flex-row items-center justify-between w-full">
          <span className="text-xl font-semibold">${Label}</span>
          <VerButton onClick={() => setShowFull(true)}>Ver más</VerButton>
        </div>
        <div className="w-full h-full min-w-0 overflow-y-auto flex flex-col gap-2">
          {loading && <span className="text-sm text-gray-400">Cargando…</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
          {!loading &&
            !error &&
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white/50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium"
              >
                {item.titulo}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
`,
    [`components/${Pascal}Full.tsx`]: `import { motion } from "motion/react";
import type { ${Pascal}Item } from "../api/${camel}";
import { use${Pascal} } from "../hooks/use${Pascal}";
import {
  overlayContainerVariants,
  overlayPanelVariants,
} from "../../widgets/overlayMotion";

interface ${Pascal}FullProps {
  onClose: () => void;
  items?: ${Pascal}Item[];
  loading?: boolean;
  error?: string | null;
}

export default function ${Pascal}Full({
  onClose,
  items,
  loading,
  error,
}: ${Pascal}FullProps) {
  const fetched = use${Pascal}(items === undefined);
  const data = items ?? fetched.items;
  const isLoading = loading ?? fetched.loading;
  const err = error !== undefined ? error : fetched.error;

  return (
    <motion.div
      variants={overlayContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center w-full h-full rounded-4xl"
    >
      <motion.div
        variants={overlayPanelVariants}
        className="flex flex-col bg-white/80 border border-gray-200 backdrop-blur-2xl w-full h-full overflow-hidden rounded-4xl"
      >
        <div className="flex items-center justify-between p-8 border-b border-gray-200 bg-linear-to-br from-gray-300/50 to-gray-300/60">
          <h1 className="text-xl font-semibold">${Label}</h1>
          <button
            type="button"
            onClick={onClose}
            className="shadow-xs text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
          >
            Cerrar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-3">
          {isLoading && <span className="text-gray-400">Cargando…</span>}
          {err && <span className="text-red-400">{err}</span>}
          {!isLoading &&
            !err &&
            data.map((item) => (
              <div
                key={item.id}
                className="bg-white/60 border border-gray-200 rounded-2xl p-4"
              >
                <div className="font-semibold">{item.titulo}</div>
                <div className="text-sm text-gray-600">{item.descripcion}</div>
              </div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
`,
    "index.ts": `export { default as ${Pascal} } from "./components/${Pascal}";
export { default as ${Pascal}Full } from "./components/${Pascal}Full";
export { use${Pascal} } from "./hooks/use${Pascal}";
`,
    [`__tests__/${Pascal}.test.tsx`]: `import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ${Pascal} from "../components/${Pascal}";

const mockUse = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use${Pascal}", () => ({ use${Pascal}: mockUse }));

describe("${Pascal}", () => {
  beforeEach(() => cleanup());

  it("muestra el título y los items", () => {
    mockUse.mockReturnValue({
      items: [{ id: 1, titulo: "Item A", descripcion: "x" }],
      loading: false,
      error: null,
    });
    render(<${Pascal} />);
    expect(screen.getByText("${Label}")).toBeInTheDocument();
    expect(screen.getByText("Item A")).toBeInTheDocument();
  });
});
`,
};

for (const [rel, content] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
}
console.log(`✔ Feature creada en src/features/${kebab}/`);

if (!noRegister) {
    let reg = readFileSync(registryPath, "utf8");
    const importLine = `import { ${Pascal} } from "../${kebab}";\n`;
    const entry = `  ${camel}: {
    type: "${camel}",
    label: "${Label}",
    component: ${Pascal},
    colSpan: 4,
    rowSpan: 2,
    color: "from-gray-100 to-gray-200",
  },
`;
    const lastImport = [...reg.matchAll(/^import .*;\n/gm)].pop();
    const marker = "};\n\nexport const WIDGET_COMPONENTS";
    if (lastImport && reg.includes(marker) && !reg.includes(`"${camel}"`)) {
        const at = lastImport.index + lastImport[0].length;
        reg = reg.slice(0, at) + importLine + reg.slice(at);
        reg = reg.replace(marker, entry + marker);
        writeFileSync(registryPath, reg);
        console.log("✔ Registrado en features/widgets/registry.ts");
    } else {
        console.warn("⚠ No se pudo registrar automáticamente en registry.ts");
    }
}

if (!noRegister) {
    const manifestPath = resolve(
        root,
        "..",
        "back",
        "api",
        "widgets_manifest.json",
    );
    const manifest = existsSync(manifestPath)
        ? JSON.parse(readFileSync(manifestPath, "utf8"))
        : [];
    if (!manifest.some((w) => w.tipo === camel)) {
        manifest.push({
            nombre: Label,
            tipo: camel,
            col_tam_default: 4,
            fila_tam_default: 2,
        });
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
        console.log("✔ Widget agregado a back/api/widgets_manifest.json");
    }
}

console.log(`
════════════════════════════════════════════════════════════
 Feature "${Label}" creada
════════════════════════════════════════════════════════════

Ubicación: front/src/features/${kebab}/

  ${kebab}/
  ├── index.ts                      Punto de entrada: exporta ${Pascal}, ${Pascal}Full y use${Pascal}
  ├── api/
  │   └── ${camel}.ts${" ".repeat(Math.max(1, 26 - camel.length))}Tipos + fetch${Pascal}() MOCKEADO (datos de ejemplo)
  ├── hooks/
  │   └── use${Pascal}.ts${" ".repeat(Math.max(1, 22 - Pascal.length))}Carga datos y maneja loading/error
  ├── components/
  │   ├── ${Pascal}.tsx${" ".repeat(Math.max(1, 24 - Pascal.length))}Versión BASE: el widget chico dentro de la plantilla
  │   └── ${Pascal}Full.tsx${" ".repeat(Math.max(1, 20 - Pascal.length))}Versión FULL: overlay a pantalla completa ("Ver más")
  └── __tests__/
      └── ${Pascal}.test.tsx        Test de ejemplo (hook mockeado)

Próximos pasos:
  1. Crear la fila del widget en la BD (si el backend ya está corriendo):
       docker compose exec backend python manage.py sync_widgets
     Sin esto el widget desaparece al guardar una plantilla.
  2. Formatear:  npx prettier --write src/features/${kebab}
  3. Reemplazar el mock en api/${camel}.ts por un fetch real: agregar el
     endpoint en src/shared/api/endpoints.ts y usar totemFetch/apiFetch.
  4. Personalizar el diseño: colores y tamaño (colSpan/rowSpan) en
     widgets/registry.ts, y las clases de ${Pascal}.tsx / ${Pascal}Full.tsx.
  5. Agregar el widget a una plantilla desde el admin y guardar.
  6. Correr los tests:  npm test -- ${kebab}

Para eliminarla:  npm run feature:delete -- ${Label}
`);
