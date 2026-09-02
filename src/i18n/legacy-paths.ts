/**
 * Permanent redirects for every address the site published before the
 * 2026-09-02 localized-path switch.
 *
 * Three tables, because a legacy address means different things depending on
 * the prefix it carried:
 *
 * - unprefixed: English URLs from when English was the default locale, plus
 *   the Turkish detail URLs that were English-shaped only because the detail
 *   template was not localized yet;
 * - `/en` prefixed: English pages whose slug changed;
 * - `/tr` prefixed: leftovers from the same period, which must resolve to the
 *   Turkish canonical and must never fall through to the unprefixed table.
 *
 * Hand written rather than derived from the content layer on purpose:
 * src/proxy.ts imports this module, and the velite output carries every MDX
 * body as a compiled string, so importing #site/content here would drag all
 * of them into the middleware bundle. The real source is the `legacySlugs`
 * frontmatter field, and tests/i18n/legacy-paths.test.ts locks the two
 * against each other in both directions.
 */

/**
 * Unprefixed legacy addresses.
 *
 * The nav paths (`/about`, `/projects`, `/contact`, `/privacy`) and `/blog`
 * were the English pages before Turkish became the default; without this
 * table next-intl would read `/about` as the English slug of the Turkish
 * about page and send the old English ranking to `/hakkimda`.
 *
 * The detail paths follow the owner's per slug language rule (2026-09-02):
 * an old unprefixed detail URL goes to the locale its slug was written in.
 * `/blog/capt-sinavina-hazirlik` is a Turkish slug, so it goes to the
 * Turkish page; `/projects/<slug>` is English-shaped, so it goes to `/en`.
 *
 * The last three rows are the Turkish content whose slug changed, keyed by
 * the new Turkish section path. Those addresses were never published (the
 * Turkish sections were `/blog` and `/projects` until 2026-09-02), so nothing
 * links to them; they are here because under dynamicParams = false the old
 * slug under the new section is a 404, and answering it costs one line.
 */
export const LEGACY_UNPREFIXED: Readonly<Record<string, string>> = {
  "/about": "/en/about",
  "/projects": "/en/projects",
  "/contact": "/en/contact",
  "/privacy": "/en/privacy",
  "/blog": "/en/blog",
  "/blog/self-hosting-with-coolify": "/en/blog/self-hosting-with-coolify",
  "/blog/capt-sinavina-hazirlik": "/yazilar/capt-sinavina-hazirlik",
  "/blog/ccna-dan-web-guvenligine": "/yazilar/ccna-dan-web-guvenligine",
  "/projects/cargo-pilot": "/en/projects/cargo-pilot",
  "/projects/hubit": "/en/projects/hubit",
  "/projects/wikonya": "/en/projects/wikonya",
  "/projects/koklu-hukuk": "/en/projects/koklu-hukuk",
  "/projects/gpa-calculator": "/en/projects/gpa-calculator",
  "/projects/ticket-purchasing-system": "/en/projects/ticket-purchasing-system",
  "/yazilar/self-hosting-with-coolify": "/yazilar/coolify-ile-kendi-sunucumda",
  "/projeler/gpa-calculator": "/projeler/not-ortalamasi-hesaplayici",
  "/projeler/ticket-purchasing-system": "/projeler/bilet-satin-alma-sistemi",
};

/**
 * `/en` prefixed pages whose English slug changed.
 *
 * Only the two posts that used to be published under their Turkish slug in
 * English; every other English address is unchanged and must stay out, or
 * the canonical page would be redirected off its own URL.
 */
export const LEGACY_EN_PREFIXED: Readonly<Record<string, string>> = {
  "/en/blog/capt-sinavina-hazirlik":
    "/en/blog/capt-preparation-in-a-docker-lab",
  "/en/blog/ccna-dan-web-guvenligine": "/en/blog/from-ccna-to-web-security",
};

/**
 * `/tr` prefixed leftovers, keyed by what remains after the prefix.
 *
 * This table has to be complete on its own: `/tr/projects/gpa-calculator`
 * stripped down to `/projects/gpa-calculator` would hit the unprefixed table
 * and land a Turkish visitor on the English page. Anything not listed falls
 * back to the remainder itself, which is already the Turkish canonical
 * (`/tr/projeler/hubit` -> `/projeler/hubit`).
 */
export const LEGACY_TR_PREFIXED: Readonly<Record<string, string>> = {
  "/about": "/hakkimda",
  "/projects": "/projeler",
  "/contact": "/iletisim",
  "/privacy": "/gizlilik",
  "/blog": "/yazilar",
  "/blog/self-hosting-with-coolify": "/yazilar/coolify-ile-kendi-sunucumda",
  "/blog/capt-sinavina-hazirlik": "/yazilar/capt-sinavina-hazirlik",
  "/blog/ccna-dan-web-guvenligine": "/yazilar/ccna-dan-web-guvenligine",
  "/yazilar/self-hosting-with-coolify": "/yazilar/coolify-ile-kendi-sunucumda",
  "/projects/cargo-pilot": "/projeler/cargo-pilot",
  "/projects/hubit": "/projeler/hubit",
  "/projects/wikonya": "/projeler/wikonya",
  "/projects/koklu-hukuk": "/projeler/koklu-hukuk",
  "/projects/gpa-calculator": "/projeler/not-ortalamasi-hesaplayici",
  "/projects/ticket-purchasing-system": "/projeler/bilet-satin-alma-sistemi",
  "/projeler/gpa-calculator": "/projeler/not-ortalamasi-hesaplayici",
  "/projeler/ticket-purchasing-system": "/projeler/bilet-satin-alma-sistemi",
};

/**
 * `/tr` and `/tr/...` were the public Turkish URLs when English was default.
 * Returns the unprefixed Turkish canonical, or null when the path is not
 * a leftover `/tr` prefix.
 */
function unprefixedTurkishPath(pathname: string): string | null {
  if (pathname !== "/tr" && !pathname.startsWith("/tr/")) {
    return null;
  }
  const rest = pathname === "/tr" ? "/" : pathname.slice("/tr".length);
  return LEGACY_TR_PREFIXED[rest] ?? rest;
}

/**
 * Drops a trailing slash, except on the root.
 *
 * Every table above is keyed by the slashless form, so `/about/` and
 * `/tr/about/` would miss the lookup entirely and fall through to next-intl,
 * which then reads `/about/` as the English slug of the Turkish about page.
 *
 * A safety net rather than the live path: with the default trailingSlash
 * setting Next.js strips the slash in its own 308 before proxy.ts runs, so a
 * request for `/about/` reaches this module as `/about` and a visitor typing
 * the slash spends two hops (`/about/` -> `/about` -> `/en/about`), verified
 * on `next start` 2026-09-02. Making it one hop would mean
 * skipTrailingSlashRedirect: true in next.config.ts, which hands every
 * trailing slash on the site to this function; not worth it for an address
 * shape the site never linked to.
 */
function withoutTrailingSlash(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * The permanent target for a legacy URL, or null when the path is not one.
 *
 * Single entry point for src/proxy.ts so the trailing slash normalization
 * cannot be applied to one table and forgotten on the other. The `/tr`
 * branch returns first and never consults the unprefixed table: that is the
 * whole reason the Turkish table exists.
 */
export function legacyRedirectTarget(pathname: string): string | null {
  const normalized = withoutTrailingSlash(pathname);
  const turkish = unprefixedTurkishPath(normalized);
  const target =
    turkish ??
    LEGACY_EN_PREFIXED[normalized] ??
    LEGACY_UNPREFIXED[normalized] ??
    null;
  if (target === null || target === undefined) return null;
  return target === pathname ? null : target;
}
