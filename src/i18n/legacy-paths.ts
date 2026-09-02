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
 * Table lookup for an already normalized path, without the OG suffix rule.
 *
 * The `/tr` branch returns first and never consults the unprefixed table:
 * that is the whole reason the Turkish table exists.
 */
function tableTarget(normalized: string): string | null {
  const turkish = unprefixedTurkishPath(normalized);
  return (
    turkish ??
    LEGACY_EN_PREFIXED[normalized] ??
    LEGACY_UNPREFIXED[normalized] ??
    null
  );
}

/**
 * The `/opengraph-image/<id>` route Next mounts under a page from the
 * opengraph-image file convention. `<id>` is whatever generateImageMetadata
 * returned, `default` here, matched loosely so a future second card still
 * follows its page.
 */
const OG_SUFFIX_PATTERN = /\/opengraph-image\/[^/]+$/;

/**
 * Whether the path names a content detail page rather than a section or a
 * static page.
 *
 * Only detail pages own a card route of their own; every other page inherits
 * the one on the [lang] segment, so appending the suffix to, say,
 * `/blog` -> `/en/blog` would name a route that does not exist and turn a
 * 404 into a 308 that ends in the same 404.
 */
function isDetailPath(pathname: string): boolean {
  const withoutPrefix = pathname.replace(/^\/(?:en|tr)(?=\/)/, "");
  return withoutPrefix.split("/").filter(Boolean).length >= 2;
}

/**
 * The permanent target for a legacy URL, or null when the path is not one.
 *
 * Single entry point for src/proxy.ts so the trailing slash normalization
 * cannot be applied to one table and forgotten on the other.
 *
 * A detail page's OG card is resolved by stripping the suffix, looking the
 * page up and putting the suffix back on the target. Those addresses were
 * published: the og:image meta of every detail page and the `media:content`
 * of both feeds named them, and the five whose slug or section changed
 * (`/blog/self-hosting-with-coolify`, `/projects/gpa-calculator`,
 * `/projects/ticket-purchasing-system` and the two `/en/blog/<tr-slug>`
 * posts) answered 404 while next-intl 307'd them to a path that no longer
 * exists. The rule costs one branch instead of tripling all three tables,
 * and it keeps a card on the same hop count as its page.
 */
export function legacyRedirectTarget(pathname: string): string | null {
  const normalized = withoutTrailingSlash(pathname);
  const target = detailCardTarget(normalized) ?? tableTarget(normalized);
  if (target === null || target === undefined) return null;
  return target === pathname ? null : target;
}

/**
 * The card rule, or null when it does not apply.
 *
 * Tried before the plain lookup so that a `/tr` prefixed card resolves in one
 * hop: the Turkish table falls back to the remainder for anything it does not
 * list, so `/tr/blog/<slug>/opengraph-image/default` would otherwise 308 to
 * the unprefixed card address and need a second hop from there. The identity
 * card (`/tr/opengraph-image/default`) has no detail page under it and is
 * left to the plain lookup.
 */
function detailCardTarget(normalized: string): string | null {
  const ogSuffix = normalized.match(OG_SUFFIX_PATTERN)?.[0];
  if (!ogSuffix) return null;
  const body = normalized.slice(0, normalized.length - ogSuffix.length);
  if (!isDetailPath(body)) return null;
  const bodyTarget = tableTarget(body);
  return bodyTarget === null ? null : `${bodyTarget}${ogSuffix}`;
}
