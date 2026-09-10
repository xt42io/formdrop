import { Elysia } from "elysia";
import { captureError } from "../lib/sentry";

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
 * Faults also go to Sentry (W2). Only the ones that reach this point: the 404,
 * validation and parse branches above are answers, not faults, and reporting
 * them would bury a real crash under a stream of clients sending bad input.
 *
 * What is sent is scrubbed hard, because request bodies on this API are
 * submission payloads -- see ../lib/sentry.
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

    // The path but not the query string, and never the body: the first
    // locates the fault, the other two are the customer's data.
    captureError(error, { code, method: request.method, path });

    return status(500, { error: "Internal server error" });
  },
);
