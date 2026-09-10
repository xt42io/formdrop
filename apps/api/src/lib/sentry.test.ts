import { describe, expect, it } from "vitest";
import { __testing } from "./sentry";

const { scrub, isSensitive } = __testing;

/**
 * These pin the privacy rule rather than the Sentry integration.
 *
 * Request bodies on this API are submission payloads -- whatever a stranger
 * typed into somebody else's contact form. W6 says payload contents,
 * recipient addresses and IPs never leave as event properties, and the
 * scrubber is what enforces that. A refactor that loosens it would not fail
 * any other test in this repository, and the damage would be invisible until
 * somebody read the crash reports.
 */
describe("isSensitive", () => {
  it("matches the obvious keys", () => {
    for (const key of ["payload", "email", "password", "token", "ip"]) {
      expect(isSensitive(key), key).toBe(true);
    }
  });

  it("matches regardless of case, separators or surrounding words", () => {
    for (const key of [
      "Payload",
      "submissionPayload",
      "recipient_email",
      "AUTHORIZATION",
      // The header an API key actually arrives in. Matching apiKey but not
      // this would be exactly the wrong way round.
      "x-api-key",
      "X-API-KEY",
      "api_key",
    ]) {
      expect(isSensitive(key), key).toBe(true);
    }
  });

  it("leaves ordinary diagnostic keys alone", () => {
    for (const key of ["code", "method", "path", "status", "formId"]) {
      expect(isSensitive(key), key).toBe(false);
    }
  });
});

describe("scrub", () => {
  it("redacts a submission payload but keeps what locates the fault", () => {
    expect(
      scrub({
        code: "UNKNOWN",
        path: "/f/contact",
        payload: { email: "visitor@example.com", message: "hello" },
      }),
    ).toEqual({
      code: "UNKNOWN",
      path: "/f/contact",
      payload: "[redacted]",
    });
  });

  it("reaches into nested objects", () => {
    expect(
      scrub({ request: { headers: { authorization: "Bearer live-key" } } }),
    ).toEqual({ request: { headers: { authorization: "[redacted]" } } });
  });

  it("reaches into arrays", () => {
    expect(scrub({ recipients: [{ email: "a@b.c" }] })).toEqual({
      recipients: "[redacted]",
    });

    expect(scrub({ rows: [{ email: "a@b.c", id: "1" }] })).toEqual({
      rows: [{ email: "[redacted]", id: "1" }],
    });
  });

  it("stops at a bounded depth rather than recursing forever", () => {
    // A cycle would hang the error handler, which would turn one crash into
    // an unresponsive process.
    const cyclic: Record<string, unknown> = { id: "1" };
    cyclic.self = cyclic;

    expect(() => scrub(cyclic)).not.toThrow();
  });

  it("passes primitives through untouched", () => {
    expect(scrub("plain")).toBe("plain");
    expect(scrub(42)).toBe(42);
    expect(scrub(null)).toBe(null);
  });
});
