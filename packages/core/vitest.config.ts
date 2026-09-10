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
 * The PRD asks for 70% lines here, and for 100% on the domain allowlist and
 * quota functions - the two places where being wrong means either letting a
 * stranger post to someone's form or billing the wrong number.
 *
 * The global gate is set at 100 rather than 70 because that is where this
 * package actually is, on every file and every metric. At 70 the gate had
 * thirty points of slack: a whole new module could arrive with no tests at
 * all and CI would still pass, which makes the number a report rather than a
 * check. These are pure functions with no I/O, so full coverage is both
 * achievable and already true, and the gate now fails on the thing it exists
 * to catch.
 *
 * The two per-file entries are therefore redundant today, and kept anyway: if
 * the global is ever relaxed, they stop those two from being relaxed with it.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/*.ts"],
      exclude: ["src/index.ts", "src/*.test.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
        branches: 100,
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
