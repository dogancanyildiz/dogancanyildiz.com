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
 * The X-Forwarded-For fallback is a best effort interim: the leftmost entry is
 * whatever the client sent when the chain is forwarded, and the Cloudflare edge
 * address when Traefik rewrites the header. Until trustCloudflare is on, the
 * Cloudflare rate limiting rule in front of /api/contact is the layer that
 * actually holds.
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
  const first = forwarded.split(",")[0]?.trim() ?? "";
  if (isIpAddress(first)) {
    return first;
  }

  return UNKNOWN_IP;
}
