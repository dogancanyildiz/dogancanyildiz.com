import { createNavigation } from "next-intl/navigation";
import { OG_IMAGE_ID } from "@/lib/seo/og-image";
import type { ContentKind } from "@/lib/content";
import { routing } from "./routing";
import type { AppLocale } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

// Route params are locale independent, but every layout component imports its
// navigation hooks from this module only (tests/i18n/app-shell.test.ts locks
// that), so the params hook goes through the same single door.
export { useParams } from "next/navigation";

export type AppHref = Parameters<typeof getPathname>[0]["href"];

/** Internal templates of the two content sections, per kind. */
const CONTENT_TEMPLATE = {
  post: "/blog/[slug]",
  project: "/projects/[slug]",
} as const;

/** Internal templates of the per page OpenGraph cards, per kind. */
const OG_TEMPLATE = {
  post: "/blog/[slug]/opengraph-image/[id]",
  project: "/projects/[slug]/opengraph-image/[id]",
} as const;

/** Internal section roots, for the language switcher's fallback. */
export const SECTION_TEMPLATE = {
  post: "/blog",
  project: "/projects",
} as const;

/**
 * Public path of one content detail page, locale prefix included.
 *
 * Every content URL goes through here rather than through pathnameForLocale
 * with a concrete path: getPathname only localizes what it can look up in
 * `pathnames`, and `/blog/foo` is not a key there. It would fall into the
 * "unknown pathnames" branch, come back unchanged and pick up nothing but
 * the locale prefix, so Turkish would keep serving `/blog/foo`. Passing the
 * template plus the slug as params is what makes `/yazilar/foo` come out.
 */
export function contentHref(
  locale: AppLocale,
  kind: ContentKind,
  slug: string
): string {
  return getPathname({
    locale,
    href: { pathname: CONTENT_TEMPLATE[kind], params: { slug } },
  });
}

/** Public path of that page's own OpenGraph card. Same rule as contentHref. */
export function ogImageHref(
  locale: AppLocale,
  kind: ContentKind,
  slug: string
): string {
  return getPathname({
    locale,
    href: {
      pathname: OG_TEMPLATE[kind],
      params: { slug, id: OG_IMAGE_ID },
    },
  });
}

/**
 * getPathname for a runtime string that is an internal pathname (`/about`)
 * or a fixed path the map does not list (`/opengraph-image/default`). The
 * generated AppHref union only names the static keys, so callers holding a
 * runtime string have to go through here.
 *
 * Not for dynamic templates or concrete content paths. A template
 * (`/blog/[slug]`) reaches next-intl with no params and throws
 * "Insufficient params provided for localized pathname"; a concrete path
 * (`/blog/foo`) is not a map key and silently comes back unlocalized. Both
 * cases belong to contentHref / ogImageHref instead.
 *
 * The locale stays a narrow AppLocale: src/types/next-intl.d.ts narrows the
 * next-intl AppConfig Locale to the routed locales, so getPathname no longer
 * accepts a bare string and a widened parameter here would break tsc.
 */
export function pathnameForLocale(locale: AppLocale, href: string): string {
  return getPathname({
    locale,
    href: href as AppHref,
  });
}

/**
 * With a `pathnames` map, next-intl's usePathname() returns the matched
 * template (`/blog/[slug]`), not the concrete path the visitor is on. Any
 * consumer that compares against content paths or builds a link from the
 * current location has to fill the template with the route params first,
 * otherwise the literal `[slug]` leaks into an href (the 2026-08-31 review
 * caught exactly that on every detail page's language switcher).
 */
export function fillPathname(
  template: string,
  params: Record<string, string | string[] | undefined>
): string {
  return template.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, (match, name) => {
    const value = params[name];
    if (value === undefined) return match;
    return Array.isArray(value) ? value.join("/") : value;
  });
}
