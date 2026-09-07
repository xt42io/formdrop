import { describe, expect, it } from "vitest";
import { isDomainAllowed, isRequestOriginAllowed } from "./domain.ts";

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

  it("checks every entry on the list, not just the first", () => {
    expect(
      isDomainAllowed("https://second.test", ["first.test", "second.test"]),
    ).toBe(true);
  });

  it("rejects an unparseable origin", () => {
    expect(isDomainAllowed("not a url", ["example.com"])).toBe(false);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(isDomainAllowed("https://EXAMPLE.com", [" Example.COM "])).toBe(
      true,
    );
  });

  it("ignores an empty entry rather than matching everything", () => {
    expect(isDomainAllowed("https://other.test", [""])).toBe(false);
  });

  describe("wildcards", () => {
    it("matches a subdomain", () => {
      expect(
        isDomainAllowed("https://app.example.com", ["*.example.com"]),
      ).toBe(true);
    });

    it("matches a nested subdomain", () => {
      expect(
        isDomainAllowed("https://a.b.example.com", ["*.example.com"]),
      ).toBe(true);
    });

    it("matches the apex too", () => {
      // Kept deliberately: the previous endsWith already admitted the apex,
      // so excluding it now would break allowlists that work today.
      expect(isDomainAllowed("https://example.com", ["*.example.com"])).toBe(
        true,
      );
    });

    it("rejects a bare '*.'", () => {
      expect(isDomainAllowed("https://anything.test", ["*."])).toBe(false);
    });
  });

  // These three were pinned as BYPASS tests asserting the old behaviour, so
  // that fixing them could not happen silently. W2 fixes them; the
  // assertions are inverted rather than deleted, so the diff shows the change.
  describe("closed bypasses", () => {
    it("a substring no longer satisfies the allowlist", () => {
      expect(
        isDomainAllowed("https://example.com.attacker.test", ["example.com"]),
      ).toBe(false);
    });

    it("a wildcard requires a dot boundary, not any suffix", () => {
      expect(isDomainAllowed("https://notexample.com", ["*.example.com"])).toBe(
        false,
      );
    });

    it("a bare entry no longer admits its subdomains", () => {
      // The consequence of dropping the substring fallback, and the one
      // visible change for existing users: this needs *.example.com now.
      expect(isDomainAllowed("https://www.example.com", ["example.com"])).toBe(
        false,
      );
    });
  });
});

describe("isRequestOriginAllowed", () => {
  it("allows a request with no origin when no allowlist is configured", () => {
    // Server-to-server posting to an unrestricted form: the common case.
    expect(isRequestOriginAllowed(undefined, [])).toBe(true);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
  ])("rejects a request with %s origin once an allowlist exists", (_l, o) => {
    // The third bypass: Express only consulted the allowlist when an Origin
    // or Referer header was present, so omitting both skipped it entirely.
    expect(isRequestOriginAllowed(o, ["example.com"])).toBe(false);
  });

  it("defers to the allowlist when an origin is present", () => {
    expect(isRequestOriginAllowed("https://example.com", ["example.com"])).toBe(
      true,
    );
    expect(isRequestOriginAllowed("https://other.test", ["example.com"])).toBe(
      false,
    );
  });
});
