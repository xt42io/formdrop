import { defineConfig } from "vite";
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
});

export default config;
