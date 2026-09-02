/**
 * In-memory sliding window rate limiter.
 *
 * The app runs as a single Node process inside a single Coolify container, so
 * a process local Map is consistent. State is lost on restart, which is an
 * accepted trade off. Cloudflare Rate Limiting sits in front of /api/contact
 * as the outer layer.
 *
 * maxKeys is a hard cap on the Map. Pruning the whole Map is O(keys), so it is
 * throttled to at most once every windowMs/10; between prunes a full Map makes
 * room by evicting the least recently active key, which is O(1) per eviction.
 * A client that forges a fresh key per request can therefore push other keys
 * out, but it can never grow memory and it can never make a single request pay
 * for a full scan.
 */

import { UNKNOWN_IP } from "./client-ip";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
};

export type RateLimiter = {
  /** Reads the budget without spending it. */
  peek(key: string, now?: number): RateLimitResult;
  /** Reads the budget and, when there is room, records a hit. */
  check(key: string, now?: number): RateLimitResult;
  /** Number of keys currently held, for diagnostics and tests. */
  size(): number;
  reset(): void;
};

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs, maxKeys = 5000 } = options;
  const pruneIntervalMs = Math.max(1, Math.floor(windowMs / 10));
  const hits = new Map<string, number[]>();
  let lastPruneAt = Number.NEGATIVE_INFINITY;

  function prune(now: number): void {
    for (const [key, stamps] of hits) {
      const fresh = stamps.filter((stamp) => now - stamp < windowMs);
      if (fresh.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, fresh);
      }
    }
  }

  function pruneIfDue(now: number): void {
    if (now - lastPruneAt < pruneIntervalMs) {
      return;
    }
    lastPruneAt = now;
    prune(now);
  }

  function freshStamps(key: string, now: number): number[] {
    return (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  }

  function blocked(stamps: number[], now: number): RateLimitResult {
    // Callers only reach this branch with a full window, so stamps is never
    // empty; falling back to now yields a full window wait if that ever changes.
    const oldest = stamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000)
      ),
    };
  }

  return {
    peek(key: string, now: number = Date.now()): RateLimitResult {
      const stamps = freshStamps(key, now);
      if (stamps.length >= limit) {
        return blocked(stamps, now);
      }
      return {
        allowed: true,
        remaining: limit - stamps.length,
        retryAfterSeconds: 0,
      };
    },

    check(key: string, now: number = Date.now()): RateLimitResult {
      // Reclaiming stale keys is time driven rather than size driven, so the
      // Map does not sit at maxKeys handing out an eviction per request.
      pruneIfDue(now);

      const stamps = freshStamps(key, now);
      // Deleting before re-inserting moves the key to the end of the Map, so
      // insertion order doubles as a least recently active order.
      hits.delete(key);

      if (stamps.length >= limit) {
        hits.set(key, stamps);
        return blocked(stamps, now);
      }

      stamps.push(now);
      if (hits.size >= maxKeys) {
        while (hits.size >= maxKeys) {
          const leastRecent = hits.keys().next().value;
          if (leastRecent === undefined) {
            break;
          }
          hits.delete(leastRecent);
        }
      }
      hits.set(key, stamps);
      return {
        allowed: true,
        remaining: limit - stamps.length,
        retryAfterSeconds: 0,
      };
    },

    size(): number {
      return hits.size;
    },

    reset(): void {
      hits.clear();
      lastPruneAt = Number.NEGATIVE_INFINITY;
    },
  };
}

export const CONTACT_RATE_LIMIT = {
  limit: 5,
  windowMs: 600_000,
} as const;

/**
 * Every request whose client ip cannot be resolved collapses onto the single
 * UNKNOWN_IP key. Sharing the per visitor budget there would let one caller
 * lock out everyone else behind that key, so the shared bucket gets its own,
 * deliberately looser budget. Once the origin only accepts Cloudflare and
 * TRUST_CF_CONNECTING_IP is turned on, the shared bucket should see almost no
 * traffic.
 */
export const UNKNOWN_RATE_LIMIT = {
  limit: 30,
  windowMs: 600_000,
} as const;

export type ContactRateLimitResult = RateLimitResult & { limit: number };

export type ContactRateLimiter = {
  peek(key: string, now?: number): ContactRateLimitResult;
  check(key: string, now?: number): ContactRateLimitResult;
  reset(): void;
};

export function createContactRateLimiter(): ContactRateLimiter {
  const perVisitor = createRateLimiter(CONTACT_RATE_LIMIT);
  const shared = createRateLimiter(UNKNOWN_RATE_LIMIT);

  function bucketFor(key: string) {
    return key === UNKNOWN_IP
      ? { limiter: shared, limit: UNKNOWN_RATE_LIMIT.limit }
      : { limiter: perVisitor, limit: CONTACT_RATE_LIMIT.limit };
  }

  return {
    peek(key, now) {
      const { limiter, limit } = bucketFor(key);
      return { ...limiter.peek(key, now), limit };
    },
    check(key, now) {
      const { limiter, limit } = bucketFor(key);
      return { ...limiter.check(key, now), limit };
    },
    reset() {
      perVisitor.reset();
      shared.reset();
    },
  };
}

// next dev re-evaluates modules on hot reload, a global handle keeps a single
// limiter alive across those reloads so the dev behaviour matches production.
const globalForRateLimit = globalThis as unknown as {
  contactRateLimiter?: ContactRateLimiter;
};

export const contactRateLimiter: ContactRateLimiter =
  globalForRateLimit.contactRateLimiter ?? createContactRateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.contactRateLimiter = contactRateLimiter;
}
