import { defineConfig } from "tsup";

/**
 * Dual ESM and CJS, per W8.
 *
 * `dts` emits the types the package ships; there is no separate declaration
 * build to fall out of step with the code.
 *
 * No `noExternal` and no bundling of dependencies, because there are none --
 * which is the point of the package and is enforced by package.json having
 * no `dependencies` key at all.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" }),
  dts: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2022",
  sourcemap: true,
});
