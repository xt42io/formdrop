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
    /*
     * Pre-compressed assets.
     *
     * The built entry chunk is 416 KB raw and 126 KB gzipped, and Nitro was
     * serving the raw one -- no content-encoding header at all. Across the
     * four chunks a first visit downloads that is 1.4 MB instead of 416 KB,
     * which is most of what LCP is waiting on.
     *
     * Compression happens at build time rather than per request, so the
     * server does no work for it and a self-hosted deploy behind a plain
     * Node process gets the same bytes as one behind a CDN.
     */
    nitro({
      compressPublicAssets: { gzip: true, brotli: true },

      /*
       * /docs is served by apps/docs, proxied from here (D2).
       *
       * "Served at formdrop.co/docs via a rewrite from apps/web -- existing
       * URLs keep working, and the docs stay on the primary domain for SEO.
       * No subdomain."
       *
       * A proxy rather than a redirect, so the address bar keeps saying
       * formdrop.co/docs and search engines see one domain. The docs app sets
       * basePath: "/docs", so the path it receives is the path it expects and
       * nothing has to be rewritten in flight.
       *
       * The origin is baked at build time, because Nitro route rules are.
       * DOCS_ORIGIN is what a deploy sets; the default is where `npm run dev`
       * puts the docs app locally.
       */
      routeRules: {
        "/docs/**": {
          proxy: `${process.env.DOCS_ORIGIN ?? "http://localhost:1300"}/docs/**`,
        },
      },
    }),
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
