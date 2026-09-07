import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  // One .env at the repo root serves every workspace, so Vite looks two levels
  // up rather than expecting a copy inside apps/web.
  envDir: "../..",
  plugins: [
    devtools(),
    tanstackStart(),
    nitro(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    viteReact(),
  ],
  server: {
    allowedHosts: true,
  },
  test: {
    // Playwright specs live in e2e/ and match vitest's default *.spec.ts
    // glob, so without this `vitest run` collects them, imports the
    // Playwright runner it cannot drive, and fails the whole test task.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});

export default config;
