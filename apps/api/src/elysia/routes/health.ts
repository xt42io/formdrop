import { Elysia, t } from "elysia";

/**
 * W2 moves health to /health; Express answered on `GET /`. The old path stays
 * as an alias -- it is the check an uptime monitor is probably already
 * pointing at, and it costs one line.
 */
export const health = new Elysia()
  .get("/health", () => ({ message: "FormDrop API v1.0" }), {
    detail: { tags: ["Public"], summary: "Health check" },
    response: { 200: t.Object({ message: t.String() }) },
  })
  .get("/", () => ({ message: "FormDrop API v1.0" }), {
    detail: { tags: ["Public"], summary: "Health check (legacy path)" },
    response: { 200: t.Object({ message: t.String() }) },
  });
