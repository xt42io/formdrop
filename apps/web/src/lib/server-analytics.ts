import { captureServer, initServerAnalytics } from "@formdrop/analytics/server";

/**
 * Server-side analytics for apps/web (PRD W6).
 *
 * For the two events no browser can report: an OAuth callback lands as a
 * redirect with no page of ours running, and a Polar webhook arrives with no
 * browser at all.
 *
 * Import this lazily from inside a server handler, never at the top of a route
 * module. `posthog-node` reaches for node builtins, and a static import would
 * put it in the client graph -- which is how `node:crypto` in packages/core
 * broke the web build once already.
 */
initServerAnalytics({ key: process.env.VITE_POSTHOG_KEY });

export { captureServer };
