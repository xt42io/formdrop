import { describe, expect, it } from "vitest";
import {
  API_KEY_PREFIX,
  apiKeyPrefix,
  generateApiKey,
  hashApiKey,
  hashesMatch,
} from "./api-key.ts";

describe("generateApiKey", () => {
  it("is recognisable on sight", () => {
    expect(generateApiKey().startsWith(API_KEY_PREFIX)).toBe(true);
  });

  it("carries 24 random bytes as hex", () => {
    const key = generateApiKey();
    const random = key.slice(API_KEY_PREFIX.length);
    expect(random).toMatch(/^[0-9a-f]{48}$/);
  });

  it("does not repeat", () => {
    const keys = new Set(Array.from({ length: 500 }, generateApiKey));
    expect(keys.size).toBe(500);
  });
});

describe("hashApiKey", () => {
  it("is stable for the same key", () => {
    const key = generateApiKey();
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("differs for different keys", () => {
    expect(hashApiKey(generateApiKey())).not.toBe(hashApiKey(generateApiKey()));
  });

  it("produces a 64-character sha-256 hex digest", () => {
    expect(hashApiKey("fd_live_abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not contain the key it hashed", () => {
    const key = generateApiKey();
    // The thing the whole change exists for: what lands in the database must
    // not be reversible to what the customer holds.
    expect(hashApiKey(key)).not.toContain(key.slice(API_KEY_PREFIX.length));
  });
});

describe("apiKeyPrefix", () => {
  it("keeps the prefix and a short discriminator", () => {
    const key = `${API_KEY_PREFIX}9f2a7c41d8e04b6f`;
    expect(apiKeyPrefix(key)).toBe("fd_live_9f2a7c41");
  });

  it("is far too short to be usable as a credential", () => {
    const key = generateApiKey();
    const shown = apiKeyPrefix(key);
    expect(shown.length).toBeLessThan(key.length / 2);
    expect(key.startsWith(shown)).toBe(true);
  });

  it("still tells two keys apart", () => {
    const prefixes = new Set(
      Array.from({ length: 200 }, () => apiKeyPrefix(generateApiKey())),
    );
    // 8 hex characters is 32 bits; collisions in 200 draws would be a bug.
    expect(prefixes.size).toBe(200);
  });
});

describe("hashesMatch", () => {
  it("accepts identical hashes", () => {
    const hash = hashApiKey("fd_live_abc");
    expect(hashesMatch(hash, hash)).toBe(true);
  });

  it("rejects different hashes", () => {
    expect(hashesMatch(hashApiKey("a"), hashApiKey("b"))).toBe(false);
  });

  it("rejects a length mismatch instead of throwing", () => {
    // timingSafeEqual throws on mismatched lengths, which would turn a bad
    // credential into a 500 rather than a 401.
    expect(() => hashesMatch("short", hashApiKey("a"))).not.toThrow();
    expect(hashesMatch("short", hashApiKey("a"))).toBe(false);
  });
});
