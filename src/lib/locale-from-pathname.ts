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

/**
 * App root metadata routes. They live outside the [lang] segment and have no
 * locale prefix to rewrite to.
 */
const RESERVED_EXACT = ["/icon", "/apple-icon"];

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
 */
export function isLocalizedRoutePath(pathname: string): boolean {
  if (RESERVED_EXACT.includes(pathname)) {
    return false;
  }
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
