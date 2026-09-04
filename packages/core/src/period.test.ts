import { describe, expect, it } from "vitest";
import { usagePeriod } from "./period.ts";

describe("usagePeriod", () => {
  it("formats a date as a UTC calendar day", () => {
    expect(usagePeriod(new Date("2026-09-03T14:22:05.000Z"))).toBe("2026-09-03");
  });

  it("uses UTC rather than local time at the day boundary", () => {
    // 23:30 UTC is already the next day in some zones and still today in
    // others; the bucket must not depend on where the server runs.
    expect(usagePeriod(new Date("2026-09-03T23:30:00.000Z"))).toBe("2026-09-03");
    expect(usagePeriod(new Date("2026-09-04T00:30:00.000Z"))).toBe("2026-09-04");
  });

  it("pads single-digit months and days", () => {
    expect(usagePeriod(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-01-05");
  });
});
