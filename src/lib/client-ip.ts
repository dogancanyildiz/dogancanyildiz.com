/**
 * Resolves the real visitor IP for rate limiting.
 *
 * CF-Connecting-IP is a plain HTTP header, a client can forge it. It is only
 * trustworthy when the request provably came from a Cloudflare range, which is
 * enforced one layer down by Traefik forwardedHeaders.trustedIPs. The caller
 * passes that decision in through trustCloudflare, this module never guesses.
 */

const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-f]{0,4}(:[0-9a-f]{0,4}){2,7}$/i;

export const UNKNOWN_IP = "unknown";

export function isIpAddress(value: string): boolean {
  if (!value) {
    return false;
  }
  if (IPV4.test(value)) {
    return true;
  }
  return value.includes(":") && IPV6.test(value);
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
