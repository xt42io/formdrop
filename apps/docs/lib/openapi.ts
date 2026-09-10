import { createOpenAPI } from "fumadocs-openapi/server";

/**
 * The API reference's source (PRD W5).
 *
 * "The API reference is generated from the Elysia OpenAPI spec, not
 * hand-written. Hand-authoring is exactly why today's docs drift from the
 * API."
 *
 * The spec is produced by apps/api from the same `t.Object` schemas that
 * validate requests at runtime, and copied into this app by the generation
 * script -- Next only traces files inside the app root, so a path reaching
 * across the workspace resolves at generation time and is missing at render.
 */
export const openapi = createOpenAPI({
  input: ["./openapi.json"],
});
