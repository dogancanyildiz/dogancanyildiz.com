/**
 * XML text escaping for the hand written RSS feed.
 *
 * Lives here rather than inside the route handler so it can be unit tested:
 * a route.ts may only export the http verbs and the segment config, and an
 * escaping bug in a feed is the kind of thing that shows up as a broken reader
 * rather than a failing page.
 *
 * & has to be replaced first, otherwise the ampersands introduced by the
 * later replacements would themselves be escaped again.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
