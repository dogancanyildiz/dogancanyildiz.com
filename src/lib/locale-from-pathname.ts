import { routing, type AppLocale } from "@/i18n/routing";

/** Derives the document locale from a pathname (/en/... -> en, else default). */
export function localeFromPathname(pathname: string): AppLocale {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }
  return routing.defaultLocale;
}

/** Segments the router owns; next-intl must never rewrite them. */
const RESERVED_PREFIXES = ["/api", "/_next", "/_vercel"];

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join("|")})(/|$)`);

/**
 * True when next-intl should handle the request.
 *
 * src/proxy.ts runs on every path so that x-pathname is always written by the
 * server, and uses this predicate to decide whether the i18n middleware runs or
 * the request is passed straight through. Locale prefixed paths always qualify,
 * /feed.xml is the unprefixed entry point that redirects into one, and anything
 * else whose last segment carries a dot is a file (robots.txt, favicon.ico,
 * static assets), not a page.
 *
 * There is no extensionless exception list any more. The app root metadata
 * routes used to be generated (/icon, /apple-icon) and needed one; they are
 * static files now (favicon.ico, icon.png, apple-icon.png), so the dot rule
 * already covers them.
 */
export function isLocalizedRoutePath(pathname: string): boolean {
  if (
    RESERVED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return false;
  }
  if (LOCALE_PREFIX.test(pathname)) {
    return true;
  }
  if (pathname === "/feed.xml") {
    return true;
  }
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  return !lastSegment.includes(".");
}
