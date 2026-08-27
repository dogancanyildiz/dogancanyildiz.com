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
 */

export const UNKNOWN_IP = "unknown";

export function isIpAddress(value: string): boolean {
  return isIP(value) !== 0;
}

export type ClientIpOptions = {
  trustCloudflare: boolean;
};

export function getClientIp(
  headers: Headers,
  options: ClientIpOptions
): string {
  if (options.trustCloudflare) {
    const cloudflareIp = headers.get("cf-connecting-ip")?.trim() ?? "";
    if (isIpAddress(cloudflareIp)) {
      return cloudflareIp;
    }
  }

  const forwarded = headers.get("x-forwarded-for") ?? "";
  const hops = forwarded
    .split(",")
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0);
  const nearest = hops[hops.length - 1] ?? "";
  if (isIpAddress(nearest)) {
    return nearest;
  }

  return UNKNOWN_IP;
}
