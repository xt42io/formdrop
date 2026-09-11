import { captureServer, initServerAnalytics } from "@formdrop/analytics/server";

/**
 * Server-side analytics for apps/web (PRD W6).
 *
 * Most of the taxonomy fires from the browser, where the person is already
 * identified. Two events cannot: an OAuth callback lands as a redirect with no
 * page of ours running, and a Polar subscription webhook arrives with no
 * browser involved at all. Both are the moment the thing actually happened, so
 * both are recorded here rather than guessed at from a later page view.
 *
 * Import this lazily from inside a server handler, never at the top of a route
 * module. `posthog-node` reaches for node builtins, and a static import would
 * put it in the client graph -- which is how `node:crypto` in packages/core
 * broke the web build once already.
 */
initServerAnalytics({ key: process.env.VITE_POSTHOG_KEY });

export { captureServer };
