import {
  copyFileSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { generateFiles } from "fumadocs-openapi";
import { createOpenAPI } from "fumadocs-openapi/server";

/**
 * Turns apps/api's spec into MDX pages under content/docs/api.
 *
 * Runs before every build, so a route added to the API shows up in the
 * reference without anybody writing a page for it -- which is what W5's
 * acceptance means by "regenerating the OpenAPI spec updates the reference
 * with no hand edits". The spec itself comes from the same `t.Object`
 * schemas that validate requests at runtime, so a route and its
 * documentation cannot disagree.
 *
 * The spec is copied in rather than referenced across the workspace. Next
 * traces the files a build needs and does not follow paths outside the app
 * root, so ../api/openapi.json resolved during generation and then was not
 * there at render time -- the pages built and threw on a schema that had
 * never loaded.
 *
 * Both the copy and the pages are generated, and both are gitignored:
 * committing them would invite somebody to edit a file the next build
 * overwrites.
 */
const SOURCE = "../api/openapi.json";
const LOCAL = "./openapi.json";
const OUTPUT = "./content/docs/api";

if (!existsSync(SOURCE)) {
  console.error(
    `${SOURCE} is missing -- run \`npm run openapi --workspace @formdrop/api\` first.`,
  );
  process.exit(1);
}

copyFileSync(SOURCE, LOCAL);

const spec = JSON.parse(readFileSync(LOCAL, "utf8"));

// Regenerated from scratch, so an endpoint deleted from the API stops having
// a page rather than leaving a stale one behind.
rmSync(OUTPUT, { recursive: true, force: true });

await generateFiles({
  input: createOpenAPI({ input: [LOCAL] }),
  output: OUTPUT,
  per: "operation",
  groupBy: "tag",
});

/*
 * The section's nav is written here rather than committed, because the
 * directory above is wiped on every run -- a hand-placed meta.json in it
 * survived exactly until the next regeneration, which is how this was found.
 *
 * The tag order is deliberate: Public first, since collecting a submission
 * is the endpoint most readers came for and the only one needing no key.
 */
writeFileSync(
  `${OUTPUT}/meta.json`,
  `${JSON.stringify(
    {
      title: "API reference",
      description: "Generated from the API's own spec. Do not edit by hand.",
      pages: ["index", "public", "forms", "submissions"],
    },
    null,
    2,
  )}
`,
);

/*
 * A landing page for the section, because the sidebar entry links to /api
 * and there was nothing there -- the tag folders each had pages, and their
 * parent 404'd.
 *
 * Generated with everything else so it cannot be lost to the wipe above, and
 * so the endpoint count in it cannot go stale.
 */
const operations = Object.values(spec.paths ?? {}).reduce(
  (n, item) => n + Object.keys(item).length,
  0,
);

writeFileSync(
  `${OUTPUT}/index.mdx`,
  `---
title: API reference
description: Every endpoint, generated from the API's own OpenAPI spec.
---

The ${operations} endpoints below are generated from the API's own OpenAPI
spec, which is built from the same schemas that validate requests at runtime.
If a route changes, this changes with it.

## Authentication

\`POST /f/{slug}\` is public — that is the endpoint your visitors' browsers
post to, and it takes no credential. Everything under \`/v1\` needs an API key
from **Settings → API keys**, sent as a bearer token:

\`\`\`bash
curl https://api.formdrop.co/v1/forms \
  -H "Authorization: Bearer fd_live_your_key"
\`\`\`

A key grants full access to every form and submission on the account, so keep
it on a server. Anything shipped to a browser is public.

## Base URL

\`\`\`
https://api.formdrop.co
\`\`\`
`,
);

console.log("[openapi] reference pages generated");
