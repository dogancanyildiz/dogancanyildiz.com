/**
 * Environment access for the portfolio.
 *
 * NEXT_PUBLIC_SITE_URL is a build time variable, it is inlined into the client
 * bundle by next build. RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL and
 * TRUST_CF_CONNECTING_IP are runtime only, they must never be exposed to the
 * client bundle or to build logs.
 *
 * The resolve* functions are pure so they can be unit tested without touching
 * process.env. The exported readers are thin wrappers around them and must be
 * called inside a request handler or a metadata function, never at module
 * scope of a route, otherwise they run during next build.
 */

export const DEV_FALLBACK_EMAIL = "onboarding@resend.dev";

export function resolveSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set. It is a required build time variable, set it in .env.local for local builds and as a Build variable in Coolify."
    );
  }
  return trimmed.replace(/\/+$/, "");
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
      `${name} is not set. It is required in production, the silent onboarding@resend.dev fallback is development only.`
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
