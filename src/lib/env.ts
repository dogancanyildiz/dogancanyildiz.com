/**
 * Environment access for the portfolio.
 *
 * NEXT_PUBLIC_SITE_URL is a build time variable, it is inlined into the client
 * bundle by next build. The SMTP_* variables, CONTACT_EMAIL, FROM_EMAIL and
 * TRUST_CF_CONNECTING_IP are runtime only, they must never be exposed to the
 * client bundle or to build logs.
 *
 * The resolve* functions are pure so they can be unit tested without touching
 * process.env. The exported readers are thin wrappers around them and must be
 * called inside a request handler or a metadata function, never at module
 * scope of a route, otherwise they run during next build.
 */

export const DEV_FALLBACK_EMAIL = "dev-fallback@dogancanyildiz.invalid";

export function resolveSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set. It is a required build time variable, set it in .env.local for local builds and as a Build variable in Coolify."
    );
  }
  const withoutSlash = trimmed.replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(withoutSlash);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is not an absolute URL: "${trimmed}". Use scheme and host, for example https://dogancanyildiz.com.`
    );
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must use http or https, got "${parsed.protocol}".`
    );
  }
  if (withoutSlash !== parsed.origin) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an origin without a path, query or fragment, got "${trimmed}".`
    );
  }

  return withoutSlash;
}

export function resolveRequiredEmail(
  name: "CONTACT_EMAIL" | "FROM_EMAIL",
  value: string | undefined,
  isProduction: boolean
): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed) {
    return trimmed;
  }
  if (isProduction) {
    throw new Error(
      `${name} is not set. It is required in production, the silent development fallback address is development only.`
    );
  }
  return DEV_FALLBACK_EMAIL;
}

export function resolveTrustCloudflare(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function siteUrl(): string {
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function contactEmail(): string {
  return resolveRequiredEmail(
    "CONTACT_EMAIL",
    process.env.CONTACT_EMAIL,
    process.env.NODE_ENV === "production"
  );
}

export function fromEmail(): string {
  return resolveRequiredEmail(
    "FROM_EMAIL",
    process.env.FROM_EMAIL,
    process.env.NODE_ENV === "production"
  );
}

export function trustsCloudflareHeaders(): boolean {
  return resolveTrustCloudflare(process.env.TRUST_CF_CONNECTING_IP);
}
