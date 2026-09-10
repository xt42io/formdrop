import * as Sentry from "@sentry/node";

/**
 * Sentry on unhandled errors (PRD W2).
 *
 * The requirement is one line in the PRD -- "structured logging plus Sentry on
 * unhandled errors, replacing console.error" -- but on this API it carries a
 * problem the other half does not: the request bodies are submission payloads.
 * They are whatever a stranger typed into somebody else's contact form, which
 * routinely means names, email addresses, phone numbers and free text. Sending
 * a crash report with the body attached would put that in a third-party
 * service, and W6's privacy rule already says payload contents, recipient
 * addresses and IPs never leave as event properties.
 *
 * So nothing is sent by default and the scrubbing below is not optional
 * configuration -- it is the reason this file exists rather than a two-line
 * init at the top of the server.
 */

/** True once init has run with a DSN. */
let enabled = false;

/**
 * Keys whose values are never worth the risk, matched case-insensitively
 * anywhere in the key. Deliberately blunt: over-scrubbing costs a little
 * debugging context, under-scrubbing leaks somebody's data.
 */
const SENSITIVE = [
  "payload",
  "data",
  "body",
  "email",
  "recipient",
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "ip",
];

/**
 * Separators are stripped before matching, so `apiKey`, `api_key` and the
 * `x-api-key` header all reduce to the same needle. Without that, the header
 * an API key actually arrives in slips through while the camelCase property
 * name is caught -- which is the wrong way round.
 */
function isSensitive(key: string): boolean {
  const normalised = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return SENSITIVE.some((needle) => normalised.includes(needle));
}

/** Replaces sensitive values in place, to a bounded depth. */
function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    out[key] = isSensitive(key) ? "[redacted]" : scrub(inner, depth + 1);
  }
  return out;
}

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  // No DSN is a supported state, not a failure: local and CI runs have none,
  // and every call below becomes a no-op rather than an error.
  if (!dsn || enabled) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    // Errors only. Tracing would sample real requests to this API, whose URLs
    // carry form slugs and whose bodies carry submissions.
    tracesSampleRate: 0,
    // Sentry's own PII collection, off. The scrubbing below is the belt; this
    // is the braces.
    sendDefaultPii: false,
    beforeSend(event) {
      // The request body on this API is a submission. There is no version of
      // attaching it that is safe, so it goes entirely rather than being
      // filtered field by field.
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        event.request.headers = scrub(event.request.headers ?? {}) as Record<
          string,
          string
        >;
        // The query string carries slugs and cursors; the URL path is enough
        // to locate a fault.
        if (event.request.query_string) delete event.request.query_string;
      }

      if (event.user) {
        // An id is enough to correlate; anything else is personal data we
        // have no reason to ship.
        event.user = event.user.id ? { id: event.user.id } : {};
      }

      event.extra = scrub(event.extra ?? {}) as Record<string, unknown>;
      event.contexts = scrub(event.contexts ?? {}) as typeof event.contexts;

      return event;
    },
  });

  enabled = true;
}

/**
 * Reports a fault. A no-op when no DSN is configured, so call sites do not
 * have to check.
 */
export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (!enabled) return;
  Sentry.captureException(error, { extra: scrub(context) as typeof context });
}

/** Exposed for the test that pins the scrubbing rules. */
export const __testing = { scrub, isSensitive };
