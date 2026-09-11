import { defineConfig } from "vitest/config";

/**
 * The live contract suite only (PRD W8). Its own config because the default
 * one excludes `*.live.test.ts`, and an exclude still applies to a file named
 * explicitly on the command line.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.live.test.ts"],
    // A real API over a real network, on a runner that may be cold.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
