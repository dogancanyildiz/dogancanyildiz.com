/**
 * Self-hosted, cookieless Umami tracker.
 *
 * Both values are public by definition, they end up in the HTML source anyway,
 * but they are read here on the server instead of through NEXT_PUBLIC_* so that
 * nothing extra is inlined into the client bundle. They are supplied to the
 * image as Docker build arguments (see Dockerfile), because this layout is
 * prerendered: a runtime-only variable would render an empty tag.
 *
 * The origin used here must stay identical to UMAMI_ORIGIN in next.config.ts,
 * otherwise the CSP blocks the request.
 */
export function UmamiScript() {
  const scriptUrl = process.env.UMAMI_SCRIPT_URL?.trim();
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim();

  if (!scriptUrl || !websiteId) {
    return null;
  }

  return (
    <script
      async
      src={`${scriptUrl.replace(/\/+$/, "")}/script.js`}
      data-website-id={websiteId}
    />
  );
}
