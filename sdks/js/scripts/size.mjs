import { gzipSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";

/**
 * The bundle budget from PRD W8: "@formdrop/js at or under 5 KB gzipped".
 *
 * A number in a document is a number nobody checks. This runs in CI, so the
 * dependency that would quietly push the package over the line fails the
 * build that adds it instead of being discovered by a user on a slow phone.
 */
const BUDGET_BYTES = 5 * 1024;
const ENTRY = "dist/index.js";

if (!existsSync(ENTRY)) {
  console.error(`${ENTRY} is missing -- run the build first.`);
  process.exit(1);
}

const raw = readFileSync(ENTRY);
const gzipped = gzipSync(raw, { level: 9 }).byteLength;
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;

console.log(`@formdrop/js  ${kb(raw.byteLength)} raw, ${kb(gzipped)} gzipped`);
console.log(`budget        ${kb(BUDGET_BYTES)} gzipped`);

if (gzipped > BUDGET_BYTES) {
  console.error(`over budget by ${kb(gzipped - BUDGET_BYTES)}`);
  process.exit(1);
}

console.log(`ok, ${kb(BUDGET_BYTES - gzipped)} to spare`);
