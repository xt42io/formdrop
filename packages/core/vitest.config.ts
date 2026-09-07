import { defineConfig } from "vitest/config";

/**
 * Coverage is measured over this package's pure entry point only.
 *
 * `src/data` is excluded deliberately: those modules are Drizzle queries whose
 * whole behaviour is the SQL they build, so a unit test of one would assert
 * that a query builder was called -- it would move the number without
 * measuring anything. They are exercised end to end by the Playwright smoke
 * path instead.
 *
 * The thresholds are the PRD's: 70% lines for the package, and 100% for the
 * domain allowlist and quota functions, which are the two places where being
 * wrong means either letting a stranger post to someone's form or billing the
 * wrong number.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/*.ts"],
      exclude: ["src/index.ts", "src/*.test.ts"],
      thresholds: {
        lines: 70,
        "src/domain.ts": {
          lines: 100,
          functions: 100,
          statements: 100,
          branches: 100,
        },
        "src/quota.ts": {
          lines: 100,
          functions: 100,
          statements: 100,
          branches: 100,
        },
      },
    },
  },
});
