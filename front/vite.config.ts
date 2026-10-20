/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "three/addons": "three/examples/jsm",
    },
  },
  optimizeDeps: {
    entries: ["index.html", "src/**/*.{ts,tsx}"],
  },
  server: {
    host: true,
    port: 5173,
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/totem/App.tsx",
        "./src/admin/App.tsx",
      ],
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://backend:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./src/test-setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          // Node >=25 expone su propio `localStorage` en `globalThis` (Web Storage
          // experimental) que devuelve `undefined` sin `--localstorage-file`. El
          // `populateGlobal` de Vitest no pisa claves ya existentes en el global, así
          // que el `localStorage` real de jsdom nunca llega al entorno de test y todo
          // código que lo use truena con "Cannot read properties of undefined".
          // Deshabilitamos el webstorage de Node para que jsdom instale el suyo.
          // Ver https://github.com/vitest-dev/vitest/issues/8757
          execArgv: ["--no-experimental-webstorage"],
        },
      },
    ],
  },
});
