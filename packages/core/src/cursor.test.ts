import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  pageSize,
} from "./cursor.ts";

const AT = new Date("2026-09-07T12:34:56.789Z");
const ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

describe("encodeCursor / decodeCursor", () => {
  it("round-trips a cursor", () => {
    const decoded = decodeCursor(encodeCursor({ createdAt: AT, id: ID }));
    expect(decoded?.createdAt.toISOString()).toBe(AT.toISOString());
    expect(decoded?.id).toBe(ID);
  });

  it("preserves millisecond precision", () => {
    // Two submissions in the same second must produce different cursors, or
    // a page boundary lands in the wrong place.
    const a = encodeCursor({
      createdAt: new Date("2026-09-07T12:00:00.001Z"),
      id: ID,
    });
    const b = encodeCursor({
      createdAt: new Date("2026-09-07T12:00:00.002Z"),
      id: ID,
    });
    expect(a).not.toBe(b);
  });

  it("is url-safe", () => {
    // base64url, so a cursor survives a query string untouched.
    const encoded = encodeCursor({ createdAt: AT, id: ID });
    expect(encoded).toBe(encodeURIComponent(encoded));
  });

  it("survives an id containing the separator", () => {
    const decoded = decodeCursor(
      encodeCursor({ createdAt: AT, id: "weird|id" }),
    );
    expect(decoded?.id).toBe("weird|id");
  });

  it.each([
    ["not base64 at all", "!!!!"],
    ["base64 with no separator", Buffer.from("nope").toString("base64url")],
    [
      "an unparseable timestamp",
      Buffer.from("never|abc").toString("base64url"),
    ],
    [
      "an empty id",
      Buffer.from("2026-09-07T12:00:00.000Z|").toString("base64url"),
    ],
    ["an empty string", ""],
  ])("returns null for %s", (_label, value) => {
    expect(decodeCursor(value)).toBeNull();
  });
});

describe("pageSize", () => {
  it("defaults when unspecified", () => {
    expect(pageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("defaults when unparseable", () => {
    // Number("abc") from a query string.
    expect(pageSize(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("caps at the maximum rather than rejecting", () => {
    expect(pageSize(10_000)).toBe(MAX_PAGE_SIZE);
  });

  it("floors a fractional request", () => {
    expect(pageSize(10.9)).toBe(10);
  });

  it.each([0, -5])("raises %s to one", (requested) => {
    expect(pageSize(requested)).toBe(1);
  });

  it("passes a reasonable request through", () => {
    expect(pageSize(25)).toBe(25);
  });
});
