import { defineConfig } from "tsup";

/**
 * React and @formdrop/js stay external.
 *
 * W8 budgets this package at 2 KB gzipped *on top of* @formdrop/js, which
 * only means anything if the client is not bundled into it -- and bundling
 * React would give an app two copies and break hooks outright.
 *
 * tsup externalises dependencies and peerDependencies by default; this is
 * explicit because the budget depends on it.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" }),
  external: ["react", "@formdrop/js"],
  dts: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  sourcemap: true,
});
