import { describe, expect, it } from "vitest";
import {
  planFor,
  quotaFor,
  submissionLimit,
  SUBMISSION_LIMITS,
} from "./quota.ts";

describe("planFor", () => {
  it("treats an active subscription as pro", () => {
    expect(planFor("active")).toBe("pro");
  });

  it.each(["canceled", "past_due", "incomplete", "", null, undefined])(
    "treats %s as free",
    (status) => {
      expect(planFor(status)).toBe("free");
    },
  );
});

describe("submissionLimit", () => {
  it("returns the configured limit per plan", () => {
    expect(submissionLimit("free")).toBe(SUBMISSION_LIMITS.free);
    expect(submissionLimit("pro")).toBe(SUBMISSION_LIMITS.pro);
  });
});

describe("quotaFor", () => {
  it("reports remaining headroom on the free plan", () => {
    expect(quotaFor(null, 40)).toEqual({
      plan: "free",
      used: 40,
      limit: 100,
      remaining: 60,
      exceeded: false,
    });
  });

  it("reports the pro limit for an active subscription", () => {
    expect(quotaFor("active", 40)).toMatchObject({
      plan: "pro",
      limit: 10_000,
      remaining: 9_960,
      exceeded: false,
    });
  });

  it("counts the boundary as exceeded", () => {
    expect(quotaFor(null, 100)).toMatchObject({ remaining: 0, exceeded: true });
  });

  it("clamps remaining at zero rather than going negative", () => {
    expect(quotaFor(null, 250)).toMatchObject({
      remaining: 0,
      exceeded: true,
    });
  });

  it("handles a fresh account", () => {
    expect(quotaFor(null, 0)).toMatchObject({
      used: 0,
      remaining: 100,
      exceeded: false,
    });
  });
});
