/**
 * The privacy rule, in one place for both runtimes (PRD W6).
 *
 * "Submission payload contents, recipient email addresses and IPs are never
 * sent as event properties." That is not advice to each call site -- it is
 * enforced here, so an event added later cannot opt out of it by forgetting,
 * and so the browser and the server cannot drift into two different ideas of
 * what is safe to send.
 *
 * This module is deliberately free of any PostHog import: it is the rule, not
 * the transport, and it is what the payload-content audit in W6's acceptance
 * actually tests.
 */

/**
 * Property names whose values never leave. Matched on the key rather than by
 * inspecting values, because a value that looks harmless today is still the
 * customer's data.
 */
const BLOCKED_SEGMENTS = new Set([
  "answers",
  "data",
  "email",
  "emails",
  "fields",
  "ip",
  "ips",
  "payload",
  "recipient",
  "recipients",
]);

/**
 * Drops blocked properties and disables PostHog's own IP collection.
 *
 * Keys are split on the separators a property name plausibly uses, so
 * `recipient_email`, `recipient.email` and `recipientEmail` are all caught by
 * the same list rather than needing an entry each.
 */
export function sanitize(
  properties: Record<string, unknown> | null,
): Record<string, unknown> {
  // PostHog derives $ip from the request server-side; nulling it is the
  // documented way to turn that off, and it matters more on the server, where
  // the request comes from our own infrastructure and the value would be
  // wrong as well as unwanted.
  const safe: Record<string, unknown> = { ...(properties ?? {}), $ip: null };

  for (const key of Object.keys(safe)) {
    if (key === "$ip") continue;
    const segments = key
      .replace(/^\$/, "")
      // camelCase boundaries as well as the explicit separators.
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .split(/[_.-]/);

    if (
      segments.some((segment) => BLOCKED_SEGMENTS.has(segment.toLowerCase()))
    ) {
      delete safe[key];
    }
  }

  return safe;
}
