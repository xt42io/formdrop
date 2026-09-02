import posthog from "posthog-js";

import type { AnalyticsEvent, CaptureArgs } from "./events.ts";

export type { AnalyticsEvent, AnalyticsEventMap } from "./events.ts";

/**
 * PostHog behind one wrapper, per the PRD: a service integration rather than an
 * architectural adoption. Nothing in the product imports `posthog-js` directly,
 * so the vendor can be swapped, stubbed in tests, or disabled by leaving the key
 * unset without touching a single call site.
 */

/**
 * Property names that must never leave the browser, from the PRD privacy rule:
 * submission payload contents, recipient email addresses and IPs. Enforced in
 * `sanitize_properties` rather than left to each call site, so it holds for
 * every event including PostHog's own.
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

function sanitize(properties: Record<string, unknown> | null) {
  // PostHog derives $ip from the request server-side; nulling it is the
  // documented way to turn that off.
  const safe: Record<string, unknown> = { ...(properties ?? {}), $ip: null };

  for (const key of Object.keys(safe)) {
    if (key === "$ip") continue;
    const segments = key.replace(/^\$/, "").split(/[_.-]/);
    if (segments.some((segment) => BLOCKED_SEGMENTS.has(segment.toLowerCase()))) {
      delete safe[key];
    }
  }

  return safe;
}

let ready = false;

export interface AnalyticsOptions {
  /** Project key. Analytics stays off entirely when this is absent. */
  key?: string;
  /** Defaults to our own reverse proxy, so ad blockers cannot erase the funnel. */
  apiHost?: string;
  /** Where the in-app "view in PostHog" links point. */
  uiHost?: string;
}

export function initAnalytics({
  key,
  apiHost = "/ingest",
  uiHost = "https://us.posthog.com",
}: AnalyticsOptions) {
  // No key configured is a supported state, not a failure: local and preview
  // environments run without analytics and every call below becomes a no-op.
  if (ready || !key || typeof window === "undefined") return;

  posthog.init(key, {
    api_host: apiHost,
    ui_host: uiHost,
    // Explicit events only (PRD). Autocapture would bury the taxonomy in noise
    // and capture text from inputs we have no business collecting.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    // Replay is P5, and stays off auth routes when it lands.
    disable_session_recording: true,
    persistence: "localStorage+cookie",
    sanitize_properties: sanitize,
  });

  ready = true;
}

export function capture<E extends AnalyticsEvent>(...args: CaptureArgs<E>) {
  if (!ready) return;
  const [event, properties] = args as [E, Record<string, unknown> | undefined];
  posthog.capture(event, properties);
}

/**
 * Called with the Better Auth user id and nothing else — no email, no name. The
 * id is enough to stitch a funnel together, and anything more would put personal
 * data in the analytics store for no analytical gain.
 */
export function identifyUser(userId: string) {
  if (!ready) return;
  posthog.identify(userId);
}

/** On sign-out, so the next person on this browser is a separate person. */
export function resetAnalytics() {
  if (!ready) return;
  posthog.reset();
}
