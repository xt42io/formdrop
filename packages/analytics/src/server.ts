import { PostHog } from "posthog-node";

import type { AnalyticsEvent, CaptureArgs } from "./events.ts";
import { sanitize } from "./sanitize.ts";

export type { AnalyticsEvent, AnalyticsEventMap } from "./events.ts";

/**
 * PostHog from the server (PRD W6).
 *
 * The acceptance is explicit: "Server events fire from the Elysia API, not
 * just the browser." Three events in the taxonomy can only be observed there
 * -- a submission arriving, and a notification being delivered or failing --
 * because they happen with nobody's browser open. Without this half the
 * funnel stops at signup and the notification failure-rate dashboard the PRD
 * asks for has no data at all.
 *
 * The same `capture()` shape as the browser wrapper, over the same event map,
 * so a name or a property that is wrong is a type error in both places. And
 * as on the browser side, nothing in the product imports posthog-node
 * directly: the vendor stays swappable.
 */

let client: PostHog | null = null;

export interface ServerAnalyticsOptions {
  /** Project key. Analytics stays off entirely when this is absent. */
  key?: string;
  /**
   * Where events are sent.
   *
   * The browser posts to our own /ingest proxy so ad blockers cannot erase
   * the funnel. The server has no ad blocker to worry about and does not sit
   * behind apps/web, so it talks to PostHog directly.
   */
  host?: string;
}

export function initServerAnalytics({
  key,
  host = "https://us.i.posthog.com",
}: ServerAnalyticsOptions) {
  // No key configured is a supported state, not a failure: local runs, CI and
  // self-hosters have none, and every call below becomes a no-op.
  if (client || !key) return;

  client = new PostHog(key, {
    host,
    // Batched. A submission must not wait on an analytics round trip -- the
    // whole point of the collect endpoint is that it answers fast.
    flushAt: 20,
    flushInterval: 10_000,
  });
}

/**
 * Records an event against a person.
 *
 * `distinctId` is the Better Auth user id, which is what the browser passes
 * to `identify`. Using anything else here -- a form id, a submission id --
 * would file these events under a separate anonymous person and the funnel
 * would never join up with the signup that preceded them.
 *
 * For a submission that is the form's *owner*, not the visitor who filled it
 * in: the visitor is a stranger with no account, and creating a PostHog
 * person for each one would both distort the numbers and store something
 * about somebody who never agreed to it.
 */
export function captureServer<E extends AnalyticsEvent>(
  distinctId: string,
  ...args: CaptureArgs<E>
) {
  if (!client) return;

  const [event, properties] = args as [E, Record<string, unknown> | undefined];

  client.capture({
    distinctId,
    event,
    properties: sanitize(properties ?? null),
  });
}

/**
 * Flushes anything still batched.
 *
 * posthog-node holds events until a batch fills or the interval elapses, so
 * without this a shutdown loses up to ten seconds of them -- and on a worker
 * that mostly idles, that could be every event it ever recorded.
 */
export async function shutdownServerAnalytics() {
  await client?.shutdown();
  client = null;
}
