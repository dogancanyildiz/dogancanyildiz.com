import { resolveUmamiTag } from "@/lib/analytics";

/**
 * Self-hosted, cookieless Umami tracker.
 *
 * Both values are public by definition, they end up in the HTML source anyway,
 * but they are read here on the server instead of through NEXT_PUBLIC_* so that
 * nothing extra is inlined into the client bundle. They are supplied to the
 * image as Docker build arguments (see Dockerfile), because this layout is
 * prerendered: a runtime-only variable would render an empty tag.
 *
 * resolveUmamiTag enforces that the configured script URL sits on the origin
 * the CSP allows, and pins data-domains to the site hostname so another host
 * running the same image cannot write into this site's statistics.
 */
export function UmamiScript() {
  const tag = resolveUmamiTag({
    scriptUrl: process.env.UMAMI_SCRIPT_URL,
    websiteId: process.env.UMAMI_WEBSITE_ID,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    isProduction: process.env.NODE_ENV === "production",
  });

  if (!tag) {
    return null;
  }

  return (
    <script
      async
      src={tag.src}
      data-website-id={tag.websiteId}
      data-domains={tag.domains}
    />
  );
}
