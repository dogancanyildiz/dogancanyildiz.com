import { isIP } from "node:net";

/**
 * Resolves the visitor IP that keys the rate limiter.
 *
 * CF-Connecting-IP is a plain HTTP header that any client can set, and Traefik
 * forwardedHeaders.trustedIPs does not touch it (that setting only governs the
 * X-Forwarded-* family). The header is only trustworthy once the origin accepts
 * connections from Cloudflare alone (Traefik ipAllowList or the host firewall,
 * phase 1). The caller passes that decision in through trustCloudflare, this
 * module never guesses.
 *
 * The X-Forwarded-For fallback takes the last entry, the hop appended by the
 * trusted proxy in front of the app. Everything to its left is client
 * supplied and forgeable. Behind Cloudflare that hop is a Cloudflare edge
 * address, so the fallback is coarse but cannot be forged; the exact visitor
 * needs trustCloudflare. The Cloudflare rate limiting rule in front of
 * /api/contact remains the outer layer.
 *
 * Whichever header wins, the value is normalized before it becomes a rate
 * limit key: one visitor must map to exactly one key, and an IPv6 visitor must
 * not be able to buy a fresh budget per request by rewriting the host part of
 * their own address. See normalizeClientIp.
 */

export const UNKNOWN_IP = "unknown";

export function isIpAddress(value: string): boolean {
  return isIP(value) !== 0;
}

/**
 * Number of 16 bit groups kept from an IPv6 address, i.e. a /64.
 *
 * One IPv6 address is not one visitor: /64 is the smallest block a provider
 * hands to a single subscriber, and every host inside it belongs to the same
 * line. Keying the limiter on the full address would let a visitor walk 2^64
 * addresses, take a fresh budget for each one and, on the way, evict every
 * other key out of the limiter's bounded map.
 */
const IPV6_PREFIX_GROUPS = 4;

/** Strips the brackets and the optional port a proxy may append to a hop. */
function stripPort(value: string): string {
  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(value);
  if (bracketed?.[1]) {
    return bracketed[1];
  }
  // Only an IPv4 hop can carry a bare port: an IPv6 address always holds at
  // least two colons of its own, so a single colon marks a port and nothing
  // else.
  const colon = value.indexOf(":");
  if (colon !== -1 && value.indexOf(":", colon + 1) === -1) {
    return value.slice(0, colon);
  }
  return value;
}

/** Expands a valid IPv6 literal into its eight 16 bit groups. */
function ipv6Groups(value: string): number[] | null {
  // A zone id (fe80::1%eth0) names a local interface, not the visitor.
  let text = (value.split("%")[0] ?? "").toLowerCase();

  // A dotted tail (::ffff:203.0.113.9) stands for the last two groups.
  const lastColon = text.lastIndexOf(":");
  const tail = text.slice(lastColon + 1);
  if (tail.includes(".")) {
    const octets = tail.split(".").map((part) => Number(part));
    if (
      octets.length !== 4 ||
      octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      return null;
    }
    const [a = 0, b = 0, c = 0, d = 0] = octets;
    const high = ((a << 8) | b).toString(16);
    const low = ((c << 8) | d).toString(16);
    text = `${text.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const halves = text.split("::");
  if (halves.length > 2) {
    return null;
  }
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const filler = halves.length === 2 ? 8 - head.length - rest.length : 0;
  if (filler < 0) {
    return null;
  }

  const parts = [...head, ...Array<string>(filler).fill("0"), ...rest];
  if (parts.length !== 8) {
    return null;
  }

  const groups: number[] = [];
  for (const part of parts) {
    if (!/^[0-9a-f]{1,4}$/.test(part)) {
      return null;
    }
    groups.push(Number.parseInt(part, 16));
  }
  return groups;
}

function ipv6Key(groups: number[]): string {
  const mapped =
    groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (mapped) {
    // ::ffff:203.0.113.9 and 203.0.113.9 are the same visitor, so they must
    // not end up holding two budgets.
    const high = groups[6] ?? 0;
    const low = groups[7] ?? 0;
    return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
  }
  const prefix = groups
    .slice(0, IPV6_PREFIX_GROUPS)
    .map((group) => group.toString(16))
    .join(":");
  return `${prefix}::/64`;
}

/**
 * Turns one hop into the canonical key the rate limiter buckets on, or null
 * when the value is not an address at all. Two spellings of one address
 * (case, leading zeros, a zone id, a port, an IPv4 mapped form) always answer
 * with the same key.
 */
export function normalizeClientIp(value: string): string | null {
  const candidate = stripPort(value.trim());
  const version = isIP(candidate);
  if (version === 4) {
    return candidate;
  }
  if (version !== 6) {
    return null;
  }
  const groups = ipv6Groups(candidate);
  return groups ? ipv6Key(groups) : null;
}

export type ClientIpOptions = {
  trustCloudflare: boolean;
};

export function getClientIp(
  headers: Headers,
  options: ClientIpOptions
): string {
  if (options.trustCloudflare) {
    const cloudflareIp = normalizeClientIp(
      headers.get("cf-connecting-ip") ?? ""
    );
    if (cloudflareIp) {
      return cloudflareIp;
    }
  }

  const forwarded = headers.get("x-forwarded-for") ?? "";
  const hops = forwarded
    .split(",")
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0);
  const nearest = normalizeClientIp(hops[hops.length - 1] ?? "");
  if (nearest) {
    return nearest;
  }

  return UNKNOWN_IP;
}
