import { describe, expect, it } from "vitest";
import {
  changePercent,
  lastCompletedPeriod,
  previousPeriod,
} from "./report-period.ts";

/**
 * Date arithmetic is where this feature would break quietly: a report that
 * covers the wrong seven days still looks like a report. These pin the
 * boundaries rather than the happy path.
 */
const at = (iso: string) => new Date(iso);

describe("lastCompletedPeriod, weekly", () => {
  it("reports the previous Monday-to-Sunday week", () => {
    // Wednesday 16 September 2026.
    expect(lastCompletedPeriod("weekly", at("2026-09-16T10:00:00Z"))).toEqual({
      start: "2026-09-07",
      end: "2026-09-13",
      label: "7–13 September 2026",
    });
  });

  it("treats Sunday as the end of the current week, not the start of one", () => {
    // Walking back `weekday` days from a Sunday lands on that same Sunday,
    // which would cover the week still in progress.
    const sunday = lastCompletedPeriod("weekly", at("2026-09-13T23:59:00Z"));
    const saturday = lastCompletedPeriod("weekly", at("2026-09-12T09:00:00Z"));

    expect(sunday).toEqual(saturday);
    expect(sunday.start).toBe("2026-08-31");
    expect(sunday.end).toBe("2026-09-06");
  });

  it("rolls over on Monday, which is when the week just ended", () => {
    const sunday = lastCompletedPeriod("weekly", at("2026-09-13T23:59:59Z"));
    const monday = lastCompletedPeriod("weekly", at("2026-09-14T00:00:01Z"));

    expect(sunday.end).toBe("2026-09-06");
    expect(monday.end).toBe("2026-09-13");
  });

  it("names a week that crosses a month boundary on both sides", () => {
    // 31 August to 6 September 2026.
    expect(
      lastCompletedPeriod("weekly", at("2026-09-09T12:00:00Z")).label,
    ).toBe("31 August – 6 September 2026");
  });
});

describe("lastCompletedPeriod, monthly", () => {
  it("reports the previous calendar month", () => {
    expect(lastCompletedPeriod("monthly", at("2026-09-16T10:00:00Z"))).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
      label: "August 2026",
    });
  });

  it("crosses the year boundary", () => {
    expect(lastCompletedPeriod("monthly", at("2026-01-03T00:00:00Z"))).toEqual({
      start: "2025-12-01",
      end: "2025-12-31",
      label: "December 2025",
    });
  });

  it("gets February right in a leap year", () => {
    expect(lastCompletedPeriod("monthly", at("2028-03-10T00:00:00Z"))).toEqual({
      start: "2028-02-01",
      end: "2028-02-29",
      label: "February 2028",
    });
  });

  it("is still the previous month on the first of a month", () => {
    const first = lastCompletedPeriod("monthly", at("2026-09-01T00:00:00Z"));
    expect(first.label).toBe("August 2026");
  });
});

describe("previousPeriod", () => {
  it("steps back one week, and the two do not overlap", () => {
    const current = lastCompletedPeriod("weekly", at("2026-09-16T10:00:00Z"));
    const before = previousPeriod("weekly", current);

    expect(before).toEqual({
      start: "2026-08-31",
      end: "2026-09-06",
      label: "31 August – 6 September 2026",
    });
    // The comparison is meaningless if the two windows share a day.
    expect(before.end < current.start).toBe(true);
  });

  it("steps back one month across a year boundary", () => {
    const current = lastCompletedPeriod("monthly", at("2026-01-15T00:00:00Z"));
    expect(previousPeriod("monthly", current).label).toBe("November 2025");
  });

  it("steps back a whole month rather than a fixed number of days", () => {
    // A 31-day hop back from 1 March lands in January, skipping February.
    const march = lastCompletedPeriod("monthly", at("2026-04-02T00:00:00Z"));
    expect(march.label).toBe("March 2026");
    expect(previousPeriod("monthly", march).label).toBe("February 2026");
  });
});

describe("changePercent", () => {
  it("reports a rise and a fall", () => {
    expect(changePercent(150, 100)).toBe(50);
    expect(changePercent(50, 100)).toBe(-50);
  });

  it("returns null when there is no baseline", () => {
    // Not a 0% change, and not an infinite rise either.
    expect(changePercent(40, 0)).toBeNull();
  });

  it("reports no change as zero, which is a real answer", () => {
    expect(changePercent(100, 100)).toBe(0);
  });
});
