/**
 * Unprefixed English nav URLs from when English was the default locale.
 *
 * After the TR-default + localized-pathname switch, next-intl would treat
 * `/about` as the English slug of the Turkish about page and 301 it to
 * `/hakkimda`. That would send every old English ranking to the Turkish
 * page. The proxy intercepts these exact paths first and sends them to the
 * prefixed English URL. Project and post detail slugs are the same in both
 * languages, so they are not listed: unprefixed `/projects/hubit` is the
 * Turkish canonical on purpose.
 */
export const LEGACY_EN_PAGE_REDIRECTS: Readonly<Record<string, string>> = {
  "/about": "/en/about",
  "/projects": "/en/projects",
  "/contact": "/en/contact",
  "/privacy": "/en/privacy",
};

/**
 * Internal English slugs that now have a Turkish public pathname. Used to
 * turn `/tr/about` into `/hakkimda` instead of stripping to `/about`,
 * which would then 308 to `/en/about`.
 */
const LEGACY_TR_PREFIXED_NAV: Readonly<Record<string, string>> = {
  "/about": "/hakkimda",
  "/projects": "/projeler",
  "/contact": "/iletisim",
  "/privacy": "/gizlilik",
};

/**
 * `/tr` and `/tr/...` were the public Turkish URLs when English was default.
 * Returns the unprefixed Turkish canonical, or null when the path is not
 * a leftover `/tr` prefix.
 */
export function unprefixedTurkishPath(pathname: string): string | null {
  if (pathname !== "/tr" && !pathname.startsWith("/tr/")) {
    return null;
  }
  const rest = pathname === "/tr" ? "/" : pathname.slice("/tr".length);
  return LEGACY_TR_PREFIXED_NAV[rest] ?? rest;
}

/**
 * Drops a trailing slash, except on the root.
 *
 * Both tables above are keyed by the slashless form, so `/about/` and
 * `/tr/about/` used to miss the lookup entirely and fall through to next-intl,
 * which then read `/about/` as the English slug of the Turkish about page.
 * The site does not serve trailing slash URLs, so normalizing here costs one
 * redirect hop instead of leaking the old ranking to the wrong page.
 */
function withoutTrailingSlash(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * The permanent target for a legacy URL, or null when the path is not one.
 *
 * Single entry point for src/proxy.ts so the trailing slash normalization
 * cannot be applied to one table and forgotten on the other.
 */
export function legacyRedirectTarget(pathname: string): string | null {
  const normalized = withoutTrailingSlash(pathname);
  const target =
    LEGACY_EN_PAGE_REDIRECTS[normalized] ?? unprefixedTurkishPath(normalized);
  if (target === null || target === undefined) return null;
  return target === pathname ? null : target;
}
