import { resolveUmamiTag, type UmamiTag } from "@/lib/analytics";

/**
 * Resolves the Umami tag for the locale layout. Env is read on the server so
 * nothing extra is inlined into the client bundle.
 */
export function layoutUmamiTag(): UmamiTag | null {
  return resolveUmamiTag({
    scriptUrl: process.env.UMAMI_SCRIPT_URL,
    websiteId: process.env.UMAMI_WEBSITE_ID,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    isProduction: process.env.NODE_ENV === "production",
  });
}

/**
 * The tracker itself, rendered straight into the prerendered document.
 *
 * Since 2026-09-03 it loads without asking. Umami as it is configured here
 * sets no cookie and stores no IP address: a unique visitor is a hash of a
 * daily rotating salt that is worthless the next day, so there is nothing to
 * consent to and nothing to withdraw. The banner, the stored choice and the
 * client side injection that went with them are gone; see
 * src/app/[lang]/privacy/page.tsx for what the visitor is told.
 *
 * A plain `defer` script rather than next/script: the tag is a static
 * external url on an origin the CSP in next.config.ts already names, so it
 * needs no nonce, no inline code and no client component to place it. React
 * renders it where it stands, and the layout is the only thing that renders
 * it, so it loads once per document and survives client side navigation.
 *
 * Production only. A development or test build that happened to carry the two
 * Umami variables would otherwise write local page views into the real site's
 * numbers.
 */
export function UmamiTracker() {
  const tag = layoutUmamiTag();
  if (!tag || process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <script
      defer
      src={tag.src}
      data-website-id={tag.websiteId}
      data-domains={tag.domains}
    />
  );
}
