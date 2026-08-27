/**
 * In-memory sliding window rate limiter.
 *
 * The app runs as a single Node process inside a single Coolify container, so
 * a process local Map is consistent. State is lost on restart, which is an
 * accepted trade off. Cloudflare Rate Limiting sits in front of /api/contact
 * as the outer layer.
 *
 * maxKeys is a hard cap on the Map: stale keys are pruned first and, when the
 * budget is still full, the least recently active key is evicted. A client
 * that forges a fresh key per request can therefore push other keys out, but
 * it can never grow memory or the per request scan past maxKeys entries.
 */

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
  check(key: string, now?: number): RateLimitResult;
  reset(): void;
};

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs, maxKeys = 5000 } = options;
  const hits = new Map<string, number[]>();

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

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const stamps = (hits.get(key) ?? []).filter(
        (stamp) => now - stamp < windowMs
      );
      // Deleting before re-inserting moves the key to the end of the Map, so
      // insertion order doubles as a least recently active order.
      hits.delete(key);

      if (stamps.length >= limit) {
        hits.set(key, stamps);
        const oldest = stamps[0];
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((oldest + windowMs - now) / 1000)
          ),
        };
      }

      stamps.push(now);
      if (hits.size >= maxKeys) {
        prune(now);
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
    reset(): void {
      hits.clear();
    },
  };
}

export const CONTACT_RATE_LIMIT = {
  limit: 5,
  windowMs: 600_000,
} as const;

// next dev re-evaluates modules on hot reload, a global handle keeps a single
// limiter alive across those reloads so the dev behaviour matches production.
const globalForRateLimit = globalThis as unknown as {
  contactRateLimiter?: RateLimiter;
};

export const contactRateLimiter: RateLimiter =
  globalForRateLimit.contactRateLimiter ??
  createRateLimiter({
    limit: CONTACT_RATE_LIMIT.limit,
    windowMs: CONTACT_RATE_LIMIT.windowMs,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.contactRateLimiter = contactRateLimiter;
}
