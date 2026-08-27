import { describe, expect, it } from "vitest";

import { CONTACT_RATE_LIMIT, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 100).allowed).toBe(true);
    expect(limiter.check("a", 200).allowed).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("a", 100);
    limiter.check("a", 200);
    const blocked = limiter.check("a", 300);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports a retry-after that covers the oldest hit in the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.check("a", 0);
    const blocked = limiter.check("a", 1000);
    expect(blocked.retryAfterSeconds).toBe(9);
  });

  it("never reports a retry-after below one second", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a", 0);
    const blocked = limiter.check("a", 999);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("lets the window slide", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("a", 100);
    expect(limiter.check("a", 500).allowed).toBe(false);
    expect(limiter.check("a", 1101).allowed).toBe(true);
  });

  it("counts down the remaining budget", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(limiter.check("a", 0).remaining).toBe(2);
    expect(limiter.check("a", 1).remaining).toBe(1);
    expect(limiter.check("a", 2).remaining).toBe(0);
  });

  it("keeps separate keys independent", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
  });

  it("forgets everything after reset", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.reset();
    expect(limiter.check("a", 1).allowed).toBe(true);
  });

  it("prunes stale keys once the key budget is exceeded", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0);
    // "a" and "b" are outside the window by now, so the fourth key is still
    // allowed and the map does not grow without bound.
    expect(limiter.check("d", 5000).allowed).toBe(true);
    expect(limiter.check("a", 5000).allowed).toBe(true);
  });
});

describe("createRateLimiter eviction", () => {
  it("evicts the least recently active key when the budget is full of fresh keys", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 10_000,
      maxKeys: 2,
    });
    limiter.check("a", 0);
    limiter.check("b", 1);
    // "a" and "b" are still inside the window, so "c" only fits by evicting
    // the least recently active key, which is "a".
    expect(limiter.check("c", 2).allowed).toBe(true);
    // "b" survived and is still rate limited.
    expect(limiter.check("b", 3).allowed).toBe(false);
    // "a" was evicted, so it starts from a clean budget.
    expect(limiter.check("a", 4).allowed).toBe(true);
  });
});

describe("CONTACT_RATE_LIMIT", () => {
  it("allows five submissions per ten minutes", () => {
    expect(CONTACT_RATE_LIMIT.limit).toBe(5);
    expect(CONTACT_RATE_LIMIT.windowMs).toBe(600_000);
  });
});
