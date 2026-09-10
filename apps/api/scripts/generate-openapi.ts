import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "../src/elysia/app";

/**
 * Writes the OpenAPI spec to a file (PRD W5).
 *
 * "The API reference is generated from the Elysia OpenAPI spec, not
 * hand-written. Hand-authoring is exactly why today's docs drift from the
 * API." The docs read this file, so the only way to change the reference is
 * to change a route.
 *
 * It asks the app for its own spec rather than reconstructing one: the same
 * `t.Object` schemas that validate a request at runtime are what describe it
 * here, so the two cannot disagree.
 *
 * No server and no database. `createApp()` builds the route table without
 * opening a connection, which is what lets this run in CI and in a docs build
 * that has no DATABASE_URL.
 */
const OUT = resolve(import.meta.dirname, "../openapi.json");

const response = await createApp().handle(
  new Request("http://localhost/openapi/json"),
);

if (!response.ok) {
  console.error(`Could not read the spec: ${response.status}`);
  process.exit(1);
}

const spec = (await response.json()) as {
  paths?: Record<string, unknown>;
  info?: { version?: string };
};

const paths = Object.keys(spec.paths ?? {});

// A spec with no paths means the plugin loaded but the routes did not, which
// would otherwise publish an empty reference page and look like a docs bug.
if (paths.length === 0) {
  console.error("The spec has no paths -- refusing to write it.");
  process.exit(1);
}

// Stable key order and a trailing newline, so regenerating an unchanged API
// produces no diff.
writeFileSync(OUT, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`openapi.json written: ${paths.length} paths`);
for (const path of paths.sort()) console.log(`  ${path}`);
