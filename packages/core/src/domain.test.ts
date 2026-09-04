import { describe, expect, it } from "vitest";
import { isDomainAllowed } from "./domain.ts";

describe("isDomainAllowed", () => {
  it("allows everything when no domains are configured", () => {
    expect(isDomainAllowed("https://anything.test", [])).toBe(true);
  });

  it("allows an exact host match", () => {
    expect(isDomainAllowed("https://example.com/page", ["example.com"])).toBe(
      true,
    );
  });

  it("rejects a host that is not on the list", () => {
    expect(isDomainAllowed("https://other.test", ["example.com"])).toBe(false);
  });

  it("matches subdomains through a wildcard", () => {
    expect(isDomainAllowed("https://app.example.com", ["*.example.com"])).toBe(
      true,
    );
  });

  it("rejects an unparseable origin", () => {
    expect(isDomainAllowed("not a url", ["example.com"])).toBe(false);
  });

  it("checks every entry on the list, not just the first", () => {
    expect(
      isDomainAllowed("https://second.test", ["first.test", "second.test"]),
    ).toBe(true);
  });

  // The two bypasses the PRD calls out (W2 fixes them). These assert the
  // CURRENT behaviour on purpose: when the fix lands, these tests should fail
  // and be inverted, so the change is impossible to make by accident.
  describe("known bypasses, pinned until the Elysia port", () => {
    it("BYPASS: a substring match satisfies the allowlist", () => {
      expect(
        isDomainAllowed("https://example.com.attacker.test", ["example.com"]),
      ).toBe(true);
    });

    it("BYPASS: a wildcard matches any suffix, not just a subdomain", () => {
      // *.example.com is meant to allow subdomains of example.com. It strips
      // the "*." and calls endsWith(), so any host whose name merely ends in
      // those characters passes — no dot boundary is required.
      expect(isDomainAllowed("https://notexample.com", ["*.example.com"])).toBe(
        true,
      );
      // A real subdomain passes too, which is the intended case.
      expect(isDomainAllowed("https://app.example.com", ["*.example.com"])).toBe(
        true,
      );
    });
  });
});
