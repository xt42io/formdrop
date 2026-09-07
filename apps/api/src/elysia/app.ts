import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { scopedCors } from "./cors";
import { errorHandling } from "./errors";
import { health } from "./routes/health";
import { formsV1 } from "./routes/forms";
import { submissionsV1 } from "./routes/submissions";
import { legacyRoutes } from "./routes/legacy";

/**
 * The Elysia app, built separately from the server that listens on a port, so
 * contract tests can call `app.handle(new Request(...))` without binding one.
 *
 * CORS is attached per route group rather than globally -- see ./cors.
 */
export function createApp() {
  return new Elysia()
    .use(errorHandling)
    .use(scopedCors)
    .use(
      openapi({
        documentation: {
          info: {
            title: "FormDrop API",
            version: "1.0.0",
            description:
              "Submission collection and form management. `POST /f/:slug` is " +
              "public; everything under /v1 takes an API key.",
          },
          tags: [
            { name: "Public", description: "No authentication" },
            { name: "Forms", description: "API key required" },
            { name: "Submissions", description: "API key required" },
          ],
        },
      }),
    )
    .use(health)
    .use(formsV1)
    .use(submissionsV1)
    .use(legacyRoutes);
}

export type App = ReturnType<typeof createApp>;
