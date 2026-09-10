import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit.ts";

const options = { limit: 3, windowMs: 60_000 };

describe("RateLimiter", () => {
  it("allows up to the limit and refuses the next", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    expect(limiter.check("form-1", at).allowed).toBe(true);
    expect(limiter.check("form-1", at).allowed).toBe(true);
    expect(limiter.check("form-1", at).allowed).toBe(true);
    expect(limiter.check("form-1", at).allowed).toBe(false);
  });

  it("counts down the remaining allowance", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    expect(limiter.check("form-1", at).remaining).toBe(2);
    expect(limiter.check("form-1", at).remaining).toBe(1);
    expect(limiter.check("form-1", at).remaining).toBe(0);
    expect(limiter.check("form-1", at).remaining).toBe(0);
  });

  it("keeps keys independent", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    for (let i = 0; i < 3; i++) limiter.check("form-1", at);

    // One form exhausting its allowance must not touch another's; these are
    // separate customers.
    expect(limiter.check("form-1", at).allowed).toBe(false);
    expect(limiter.check("form-2", at).allowed).toBe(true);
  });

  it("opens a fresh window once the old one expires", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    for (let i = 0; i < 3; i++) limiter.check("form-1", at);
    expect(limiter.check("form-1", at).allowed).toBe(false);

    expect(limiter.check("form-1", at + options.windowMs).allowed).toBe(true);
  });

  it("reports a retry-after that is never zero while refusing", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    for (let i = 0; i < 3; i++) limiter.check("form-1", at);

    // A Retry-After of 0 invites an immediate retry that is certain to be
    // refused again.
    const justBeforeReset = at + options.windowMs - 1;
    const refused = limiter.check("form-1", justBeforeReset);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("reports zero retry-after when it is allowing", () => {
    const limiter = new RateLimiter(options);
    expect(limiter.check("form-1", 1_000_000).retryAfterSeconds).toBe(0);
  });

  it("sweeps expired windows so the map cannot grow forever", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    limiter.check("a", at);
    limiter.check("b", at);
    expect(limiter.size).toBe(2);

    // Nothing has expired yet.
    expect(limiter.sweep(at)).toBe(0);
    expect(limiter.size).toBe(2);

    expect(limiter.sweep(at + options.windowMs)).toBe(2);
    expect(limiter.size).toBe(0);
  });

  it("does not sweep a window that is still open", () => {
    const limiter = new RateLimiter(options);
    const at = 1_000_000;

    limiter.check("a", at);
    limiter.check("b", at + options.windowMs);

    limiter.sweep(at + options.windowMs);

    // "b" opened a window that runs past the sweep, so its count survives.
    expect(limiter.size).toBe(1);
    expect(limiter.check("b", at + options.windowMs).remaining).toBe(1);
  });
});
