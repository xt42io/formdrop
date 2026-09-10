import { gzipSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";

/**
 * The bundle budget from PRD W8: "@formdrop/react at or under 2 KB on top"
 * of @formdrop/js.
 *
 * "On top" is why the build marks react and @formdrop/js external -- if the
 * client were bundled in, this number would measure both packages and the
 * budget would mean nothing.
 *
 * A number in a document is a number nobody checks. This runs as part of the
 * build, so the dependency that would push the package over the line fails
 * the build that adds it.
 */
const BUDGET_BYTES = 2 * 1024;
const ENTRY = "dist/index.js";

if (!existsSync(ENTRY)) {
  console.error(`${ENTRY} is missing -- run the build first.`);
  process.exit(1);
}

const raw = readFileSync(ENTRY);
const gzipped = gzipSync(raw, { level: 9 }).byteLength;
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;

console.log(`@formdrop/react  ${kb(raw.byteLength)} raw, ${kb(gzipped)} gzipped`);
console.log(`budget        ${kb(BUDGET_BYTES)} gzipped`);

if (gzipped > BUDGET_BYTES) {
  console.error(`over budget by ${kb(gzipped - BUDGET_BYTES)}`);
  process.exit(1);
}

console.log(`ok, ${kb(BUDGET_BYTES - gzipped)} to spare`);
