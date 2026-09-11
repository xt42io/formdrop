import type { PostHog } from "posthog-js";

import type { AnalyticsEvent, CaptureArgs } from "./events.ts";
import { sanitize } from "./sanitize.ts";

export type { AnalyticsEvent, AnalyticsEventMap } from "./events.ts";

/**
 * PostHog behind one wrapper, per the PRD: a service integration rather than an
 * architectural adoption. Nothing in the product imports `posthog-js` directly,
 * so the vendor can be swapped, stubbed in tests, or disabled by leaving the key
 * unset without touching a single call site.
 */

let client: PostHog | null = null;

/** Bounded: analytics must never be the reason a tab runs out of memory. */
const MAX_QUEUED = 50;
const queued: Array<[string, Record<string, unknown> | undefined]> = [];
let identity: string | null = null;
let starting = false;

export interface AnalyticsOptions {
  /** Project key. Analytics stays off entirely when this is absent. */
  key?: string;
  /** Defaults to our own reverse proxy, so ad blockers cannot erase the funnel. */
  apiHost?: string;
  /** Where the in-app "view in PostHog" links point. */
  uiHost?: string;
}

export async function initAnalytics({
  key,
  apiHost = "/ingest",
  uiHost = "https://us.posthog.com",
}: AnalyticsOptions) {
  // No key configured is a supported state, not a failure: local and preview
  // environments run without analytics and every call below becomes a no-op.
  if (client || starting || !key || typeof window === "undefined") return;
  starting = true;

  const { default: posthog } = await import("posthog-js");

  posthog.init(key, {
    api_host: apiHost,
    ui_host: uiHost,
    // Explicit events only (PRD). Autocapture would bury the taxonomy in noise
    // and capture text from inputs we have no business collecting.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    /*
     * Replay never starts on its own. The product decides per route by
     * calling setSessionRecording, and defaulting to off means a route that
     * nobody has classified yet -- a new auth screen, an error page, a
     * password reset -- is not recorded by accident. Opting in is a decision
     * somebody has to make; opting out must not be.
     */
    disable_session_recording: true,
    session_recording: {
      // Every input, not just the ones that look sensitive. This is a form
      // product: the fields being typed into belong to our customers' visitors
      // and there is no version of recording them that is acceptable.
      maskAllInputs: true,
      maskTextSelector: "[data-private]",
    },
    persistence: "localStorage+cookie",
    sanitize_properties: sanitize,
  });

  client = posthog;
  starting = false;

  // Identity first: an event flushed before it would be attributed to an
  // anonymous id and the funnel would show two people instead of one.
  if (identity) posthog.identify(identity);
  for (const [event, properties] of queued.splice(0)) {
    posthog.capture(event, properties);
  }
}

export function capture<E extends AnalyticsEvent>(...args: CaptureArgs<E>) {
  const [event, properties] = args as [E, Record<string, unknown> | undefined];
  if (client) {
    client.capture(event, properties);
    return;
  }
  // Only worth queueing if a load is actually in flight; with no key
  // configured nothing will ever flush it.
  if (starting && queued.length < MAX_QUEUED) queued.push([event, properties]);
}

/**
 * Called with the Better Auth user id and nothing else — no email, no name. The
 * id is enough to stitch a funnel together, and anything more would put personal
 * data in the analytics store for no analytical gain.
 */
export function identifyUser(userId: string) {
  identity = userId;
  client?.identify(userId);
}

/**
 * Turns session replay on or off for the surface the person is currently on
 * (PRD W6: "on for /app/*, off for auth routes, with input masking").
 *
 * Called on every navigation rather than once at init, because a single-page
 * app never reloads: someone who signs out of the dashboard and lands on the
 * login form is the same document, and a recorder left running would follow
 * them onto it.
 *
 * Safe before init -- with no client there is nothing to start, and the next
 * navigation after one appears will call this again.
 */
export function setSessionRecording(enabled: boolean) {
  if (!client) return;

  if (enabled) client.startSessionRecording();
  else client.stopSessionRecording();
}

/** On sign-out, so the next person on this browser is a separate person. */
export function resetAnalytics() {
  identity = null;
  queued.length = 0;
  client?.reset();
}
