import { describe, expect, it } from "vitest";
import { sanitize } from "./sanitize.ts";

/**
 * W6's acceptance includes "a payload-content audit of captured events comes
 * back clean". This is that audit, run on every commit instead of once by
 * hand.
 *
 * The rule it enforces: submission payload contents, recipient email
 * addresses and IPs never leave as event properties. Every one of those is
 * somebody else's data -- a stranger filled in a form on a customer's site
 * and has no relationship with us at all.
 */
describe("sanitize", () => {
  it("drops a submission payload", () => {
    expect(sanitize({ payload: { email: "visitor@example.com" } })).toEqual({
      $ip: null,
    });
  });

  it("drops recipient addresses under any spelling", () => {
    for (const key of [
      "email",
      "emails",
      "recipient",
      "recipients",
      "recipient_email",
      "recipient.email",
      "recipientEmail",
    ]) {
      const out = sanitize({ [key]: "someone@example.com" });
      expect(out, key).toEqual({ $ip: null });
    }
  });

  it("drops IPs", () => {
    expect(sanitize({ ip: "203.0.113.7" })).toEqual({ $ip: null });
    expect(sanitize({ ips: ["203.0.113.7"] })).toEqual({ $ip: null });
  });

  it("drops the other payload spellings the taxonomy could grow", () => {
    for (const key of ["answers", "data", "fields", "form_data", "formData"]) {
      expect(sanitize({ [key]: "x" }), key).toEqual({ $ip: null });
    }
  });

  it("turns off PostHog's own IP collection", () => {
    // The server derives $ip from the request, which on the API is our own
    // infrastructure -- wrong as well as unwanted.
    expect(sanitize(null).$ip).toBe(null);
    expect(sanitize({ channel: "slack" }).$ip).toBe(null);
  });

  it("keeps the properties the taxonomy actually declares", () => {
    expect(sanitize({ channel: "slack" })).toEqual({
      channel: "slack",
      $ip: null,
    });
    expect(sanitize({ provider: "google_sheets" })).toEqual({
      provider: "google_sheets",
      $ip: null,
    });
    expect(sanitize({ language: "curl" })).toEqual({
      language: "curl",
      $ip: null,
    });
    expect(sanitize({ page: "/docs/api" })).toEqual({
      page: "/docs/api",
      $ip: null,
    });
  });

  it("does not mutate what it was given", () => {
    const original = { payload: { a: 1 }, channel: "email" };
    sanitize(original);
    // A caller reusing the object after capture must not find it gutted.
    expect(original).toEqual({ payload: { a: 1 }, channel: "email" });
  });

  it("leaves a PostHog-reserved property alone unless it is blocked", () => {
    expect(sanitize({ $current_url: "/pricing" })).toEqual({
      $current_url: "/pricing",
      $ip: null,
    });
    // ...but a reserved name that is blocked is still blocked.
    expect(sanitize({ $ip_address: "203.0.113.7" })).toEqual({ $ip: null });
  });
});
