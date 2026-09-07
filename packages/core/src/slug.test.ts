import { describe, expect, it } from "vitest";
import { generateFormSlug, SLUG_LENGTH } from "./slug.ts";

describe("generateFormSlug", () => {
  it("produces a slug of the expected length", () => {
    expect(generateFormSlug()).toHaveLength(SLUG_LENGTH);
  });

  it("uses only URL-safe alphanumerics", () => {
    // A slug ends up in a public endpoint path, so anything needing escaping
    // would be a problem.
    for (let i = 0; i < 200; i++) {
      expect(generateFormSlug()).toMatch(/^[a-zA-Z0-9]{8}$/);
    }
  });

  it("is deterministic given a deterministic source", () => {
    const always = () => 0;
    expect(generateFormSlug(always)).toBe("aaaaaaaa");
  });

  it("reaches the last character of the alphabet", () => {
    // Math.floor(0.999... * 62) === 61, the final "9". Guards against an
    // off-by-one that would silently shrink the alphabet.
    const nearlyOne = () => 0.9999999;
    expect(generateFormSlug(nearlyOne)).toBe("99999999");
  });

  it("varies between calls", () => {
    const slugs = new Set(Array.from({ length: 50 }, () => generateFormSlug()));
    expect(slugs.size).toBeGreaterThan(45);
  });
});
