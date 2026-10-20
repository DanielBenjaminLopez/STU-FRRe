#!/usr/bin/env node
/**
 * Elimina una feature creada con feature:add.
 *
 * Uso:
 *   npm run feature:delete                (pregunta el nombre)
 *   npm run feature:delete -- Mi Widget
 *   npm run feature:delete -- Mi Widget --yes     (sin confirmación)
 *   npm run feature:delete -- Mi Widget --force   (permite borrar features que no
 *                                                  estén en widgets_manifest.json)
 *
 * Borra src/features/<kebab>/, su entrada en widgets/registry.ts y en
 * back/api/widgets_manifest.json. La fila de la BD NO se borra sola (hay que
 * quitarla a mano; el script imprime el comando).
 */
import { createInterface } from "node:readline/promises";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const featuresDir = join(root, "src", "features");
const registryPath = join(featuresDir, "widgets", "registry.ts");
const manifestPath = resolve(
    root,
    "..",
    "back",
    "api",
    "widgets_manifest.json",
);

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const force = args.includes("--force");
let rawName = args.filter((a) => !a.startsWith("--")).join(" ") || undefined;

const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : [];

const rl = createInterface({ input: process.stdin, output: process.stdout });

if (!rawName) {
    if (manifest.length) {
        console.log(
            "Features eliminables: " + manifest.map((w) => w.tipo).join(", "),
        );
    }
    rawName = await rl.question("Nombre de la feature a eliminar: ");
}

const words = (rawName ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-zA-Z0-9]+|(?<=[a-z0-9])(?=[A-Z])/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

if (words.length === 0) {
    console.error("Nombre inválido.");
    process.exit(1);
}

const cap = (w) => w[0].toUpperCase() + w.slice(1);
const kebab = words.join("-");
const camel = words[0] + words.slice(1).map(cap).join("");
const Pascal = words.map(cap).join("");

const dir = join(featuresDir, kebab);
const inManifest = manifest.some((w) => w.tipo === camel);

if (!existsSync(dir)) {
    console.error(`No existe src/features/${kebab}`);
    process.exit(1);
}
if (!inManifest && !force) {
    console.error(
        `"${kebab}" no figura en widgets_manifest.json (¿es una feature original?). ` +
            "Usá --force si realmente querés borrarla.",
    );
    process.exit(1);
}

if (!yes) {
    const ans = await rl.question(
        `Se eliminará src/features/${kebab}/ y su registro. ¿Continuar? (s/N): `,
    );
    if (!/^(s|si|sí|y|yes)$/i.test(ans.trim())) {
        console.log("Cancelado.");
        rl.close();
        process.exit(0);
    }
}
rl.close();

rmSync(dir, { recursive: true, force: true });
console.log(`✔ Eliminado src/features/${kebab}/`);

// registry.ts
let reg = readFileSync(registryPath, "utf8");
const importRe = new RegExp(
    `^import \\{ ${Pascal} \\} from "\\.\\./${kebab}";\\n`,
    "m",
);
const entryRe = new RegExp(`^  ${camel}: \\{[\\s\\S]*?^  \\},\\n`, "m");
let touched = false;
if (importRe.test(reg)) {
    reg = reg.replace(importRe, "");
    touched = true;
} else {
    console.warn(
        `⚠ No encontré el import de ${Pascal} en registry.ts; revisalo a mano.`,
    );
}
if (entryRe.test(reg)) {
    reg = reg.replace(entryRe, "");
    touched = true;
} else {
    console.warn(`⚠ No encontré la entrada "${camel}" en registry.ts.`);
}
if (touched) {
    writeFileSync(registryPath, reg);
    console.log("✔ Quitado de features/widgets/registry.ts");
}

// manifest
if (inManifest) {
    writeFileSync(
        manifestPath,
        JSON.stringify(
            manifest.filter((w) => w.tipo !== camel),
            null,
            2,
        ) + "\n",
    );
    console.log("✔ Quitado de back/api/widgets_manifest.json");
}

console.log(
    `\nQueda la fila del widget en la BD (las plantillas que lo usan quedarán con un widget huérfano). Para borrarla:\n` +
        `  docker compose exec backend python manage.py shell -c "from api.models import Widget; print(Widget.objects.filter(tipo='${camel}').delete())"`,
);
