import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const shutdown = vi.fn().mockResolvedValue(undefined);

/*
 * posthog-node is replaced wholesale so these run without a network or a
 * project key. What is under test is the wrapper's contract -- who an event
 * is attributed to, and what is allowed to travel with it -- not PostHog.
 */
vi.mock("posthog-node", () => ({
  PostHog: class {
    capture = capture;
    shutdown = shutdown;
  },
}));

const {
  captureServer,
  initServerAnalytics,
  shutdownServerAnalytics,
} = await import("./server.ts");

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(async () => {
  await shutdownServerAnalytics();
});

describe("without a key", () => {
  it("captures nothing rather than throwing", () => {
    // Local runs, CI and self-hosters have no key. Analytics being absent is
    // a supported state, not a failure.
    expect(() => captureServer("u1", "submission_received")).not.toThrow();
    expect(capture).not.toHaveBeenCalled();
  });
});

describe("captureServer", () => {
  beforeEach(() => {
    initServerAnalytics({ key: "phc_test" });
  });

  it("attributes the event to the person given", () => {
    captureServer("user-123", "submission_received");

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture.mock.calls[0][0]).toMatchObject({
      distinctId: "user-123",
      event: "submission_received",
    });
  });

  it("carries the properties the taxonomy declares", () => {
    captureServer("user-123", "notification_sent", { channel: "slack" });

    expect(capture.mock.calls[0][0].properties).toMatchObject({
      channel: "slack",
    });
  });

  it("applies the privacy rule to server events too", () => {
    // W6 forbids payload contents, recipient addresses and IPs as event
    // properties. The browser wrapper enforces that; so must this one, or
    // the rule holds on only half the product.
    captureServer("user-123", "notification_sent", {
      channel: "email",
      // @ts-expect-error -- not in the taxonomy, which is the point: even if
      // a call site smuggles one in, it must not travel.
      recipient_email: "someone@example.com",
      payload: { message: "hello" },
      ip: "203.0.113.7",
    });

    const sent = capture.mock.calls[0][0].properties;
    expect(sent).toMatchObject({ channel: "email" });
    expect(sent).not.toHaveProperty("recipient_email");
    expect(sent).not.toHaveProperty("payload");
    expect(sent).not.toHaveProperty("ip");
    expect(sent.$ip).toBe(null);
  });

  it("initialises once, however many times it is called", () => {
    initServerAnalytics({ key: "phc_test" });
    initServerAnalytics({ key: "phc_other" });

    captureServer("user-123", "submission_received");
    expect(capture).toHaveBeenCalledTimes(1);
  });
});

describe("shutdownServerAnalytics", () => {
  it("flushes what is still batched", async () => {
    initServerAnalytics({ key: "phc_test" });
    captureServer("user-123", "submission_received");

    await shutdownServerAnalytics();

    // posthog-node holds events until a batch fills or the interval elapses.
    // On a worker that mostly idles, skipping this could drop every event it
    // ever recorded.
    expect(shutdown).toHaveBeenCalledTimes(1);
  });

  it("is safe to call when analytics never started", async () => {
    await expect(shutdownServerAnalytics()).resolves.toBeUndefined();
  });
});
