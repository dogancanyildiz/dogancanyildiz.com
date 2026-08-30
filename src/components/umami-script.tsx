import { resolveUmamiTag, type UmamiTag } from "@/lib/analytics";

/**
 * Resolves the Umami tag for the locale layout. Env is read on the server
 * so nothing extra is inlined into the client bundle. The script itself
 * is injected by ConsentProvider only after the visitor allows measurement.
 */
export function layoutUmamiTag(): UmamiTag | null {
  return resolveUmamiTag({
    scriptUrl: process.env.UMAMI_SCRIPT_URL,
    websiteId: process.env.UMAMI_WEBSITE_ID,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    isProduction: process.env.NODE_ENV === "production",
  });
}
