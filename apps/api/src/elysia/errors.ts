import { Elysia } from "elysia";

/**
 * One place where an unhandled error becomes a response and a log line.
 *
 * Express scattered `console.error` through the route handlers and returned
 * `{ error: "Internal server error" }` from whichever try/catch happened to
 * be there -- so a route without one returned Express's HTML error page, and
 * a route with one logged an unstructured string.
 *
 * Logs are JSON so a collector can index them by code and path rather than
 * grepping message text.
 *
 * Sentry is the remaining half of W2's requirement and is deliberately not
 * wired here: it needs a DSN and a decision about PII scrubbing, since request
 * bodies on this API are submission payloads. This is the seam it attaches to.
 */
export const errorHandling = new Elysia({ name: "error-handling" }).onError(
  { as: "global" },
  ({ code, error, path, request, status }) => {
    // Elysia's own 404 and validation failures are answers, not faults.
    if (code === "NOT_FOUND") {
      return status(404, { error: "Not found" });
    }

    if (code === "VALIDATION") {
      return status(400, { error: "Invalid request" });
    }

    // A body the client sent malformed. express.json() answered 400 for this;
    // without the case it would fall through to the 500 below, which would be
    // a parity break on the one endpoint W2 says must never break.
    if (code === "PARSE") {
      return status(400, { error: "Invalid request body" });
    }

    console.error(
      JSON.stringify({
        level: "error",
        code,
        method: request.method,
        path,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );

    return status(500, { error: "Internal server error" });
  },
);
