import { describe, expect, it } from "vitest";

import { UNKNOWN_IP } from "./client-ip";
import {
  CONTACT_RATE_LIMIT,
  UNKNOWN_RATE_LIMIT,
  createContactRateLimiter,
  createRateLimiter,
} from "./rate-limit";

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

describe("createRateLimiter peek", () => {
  it("reports the budget without spending it", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.peek("a", 0)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
    expect(limiter.peek("a", 0).remaining).toBe(2);
    expect(limiter.size()).toBe(0);
  });

  it("reports a blocked key with the same retry-after as check", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.check("a", 0);
    expect(limiter.peek("a", 1000)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 9,
    });
  });
});

describe("createRateLimiter pruning cadence", () => {
  it("reclaims stale keys on a check that falls outside the throttle", () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("b", 500);
    expect(limiter.size()).toBe(2);

    // 1010 is more than windowMs/10 after the previous scan, so the scan runs
    // and drops "a", which left the window at 1000. Without it the map would
    // hold three keys here.
    limiter.check("c", 1010);
    expect(limiter.size()).toBe(2);
  });

  it("skips the scan while inside the throttle window", () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 1000 });
    limiter.check("a", 0);
    // Scans at 0 and at 950, so the last scan happened while "a" was still
    // fresh.
    limiter.check("b", 950);

    // "a" left the window at 1000, but 1020 sits only 70ms after the last
    // scan, so the stale key is still held instead of costing a full pass.
    limiter.check("c", 1020);
    expect(limiter.size()).toBe(3);

    // 1060 is far enough from the last scan, so "a" finally goes.
    limiter.check("c", 1060);
    expect(limiter.size()).toBe(2);
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

  it("never grows past the key budget", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 10_000,
      maxKeys: 4,
    });
    for (let i = 0; i < 100; i += 1) {
      limiter.check(`forged-${i}`, i);
    }
    expect(limiter.size()).toBeLessThanOrEqual(4);
  });
});

describe("CONTACT_RATE_LIMIT", () => {
  it("allows five submissions per ten minutes", () => {
    expect(CONTACT_RATE_LIMIT.limit).toBe(5);
    expect(CONTACT_RATE_LIMIT.windowMs).toBe(600_000);
  });

  it("gives the shared unknown key a looser budget over the same window", () => {
    expect(UNKNOWN_RATE_LIMIT.limit).toBeGreaterThan(CONTACT_RATE_LIMIT.limit);
    expect(UNKNOWN_RATE_LIMIT.windowMs).toBe(CONTACT_RATE_LIMIT.windowMs);
  });
});

describe("createContactRateLimiter", () => {
  it("reports the budget that applies to the key", () => {
    const limiter = createContactRateLimiter();
    expect(limiter.peek("203.0.113.7", 0).limit).toBe(CONTACT_RATE_LIMIT.limit);
    expect(limiter.peek(UNKNOWN_IP, 0).limit).toBe(UNKNOWN_RATE_LIMIT.limit);
  });

  it("keeps the shared unknown bucket out of the per visitor budget", () => {
    const limiter = createContactRateLimiter();
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit; i += 1) {
      limiter.check(UNKNOWN_IP, i);
    }
    // The shared key is nowhere near its own limit yet, and a resolved ip is
    // untouched by that traffic.
    expect(limiter.check(UNKNOWN_IP, 10).allowed).toBe(true);
    expect(limiter.check("203.0.113.7", 10).allowed).toBe(true);
  });

  it("still blocks the shared key once its looser budget is spent", () => {
    const limiter = createContactRateLimiter();
    for (let i = 0; i < UNKNOWN_RATE_LIMIT.limit; i += 1) {
      limiter.check(UNKNOWN_IP, i);
    }
    const blocked = limiter.check(UNKNOWN_IP, 100);
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(UNKNOWN_RATE_LIMIT.limit);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("peek does not spend a slot", () => {
    const limiter = createContactRateLimiter();
    for (let i = 0; i < 20; i += 1) {
      limiter.peek("203.0.113.7", i);
    }
    expect(limiter.check("203.0.113.7", 21).allowed).toBe(true);
  });

  it("resets both buckets", () => {
    const limiter = createContactRateLimiter();
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit; i += 1) {
      limiter.check("203.0.113.7", i);
    }
    for (let i = 0; i < UNKNOWN_RATE_LIMIT.limit; i += 1) {
      limiter.check(UNKNOWN_IP, i);
    }
    limiter.reset();
    expect(limiter.check("203.0.113.7", 0).allowed).toBe(true);
    expect(limiter.check(UNKNOWN_IP, 0).allowed).toBe(true);
  });
});
