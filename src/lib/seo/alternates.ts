import type { Metadata } from "next";
import { pathnameForLocale } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import type { Locale } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";

// Phase 0's env layer is the single site-url gate. Re-exported here so SEO
// callers read it from one module.
export { siteUrl };

/**
 * Public pathname for one locale. Goes through next-intl getPathname so a
 * localized slug (`/hakkimda`) and a locale prefix (`/en/about`) cannot
 * drift from the routing config. Unknown paths (OG images, a concrete
 * `/blog/slug`) still get the as-needed prefix.
 */
export function localePath(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const trimmed = normalized === "/" ? "/" : normalized.replace(/\/+$/, "");
  return pathnameForLocale(locale, trimmed);
}

export function absoluteUrl(locale: Locale, path: string): string {
  return `${siteUrl()}${localePath(locale, path)}`;
}

/**
 * og:locale values for the routed locales. Facebook and LinkedIn expect the
 * underscore form, not the BCP 47 tag used by the html lang attribute.
 */
const OG_LOCALES = { en: "en_US", tr: "tr_TR" } as const;

/**
 * Complete OpenGraph object for one page.
 *
 * Next merges metadata shallowly: a segment that returns no openGraph inherits
 * the parent object untouched, so every subpage would advertise the home page
 * url and title even though its own title and canonical are correct. Every
 * page therefore builds its own object, and the object has to be complete
 * because a child openGraph replaces the parent one instead of merging into
 * it.
 */
export function buildOpenGraph(
  locale: Locale,
  path: string,
  content: {
    title: string;
    description: string;
    siteName: string;
    imageAlt: string;
    type?: "website" | "article";
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  }
): NonNullable<Metadata["openGraph"]> {
  // article:author, article:modified_time and article:tag only mean anything
  // on an article, and Next emits whatever it is handed, so an article-only
  // field on a website object would produce a meta tag no consumer reads.
  const isArticle = content.type === "article";

  return {
    type: content.type ?? "website",
    siteName: content.siteName,
    title: content.title,
    description: content.description,
    url: absoluteUrl(locale, path),
    locale: OG_LOCALES[locale],
    alternateLocale: routing.locales
      .filter((candidate) => candidate !== locale)
      .map((candidate) => OG_LOCALES[candidate]),
    ...(isArticle && content.publishedTime
      ? { publishedTime: content.publishedTime }
      : {}),
    ...(isArticle && content.modifiedTime
      ? { modifiedTime: content.modifiedTime }
      : {}),
    ...(isArticle && content.authors?.length
      ? { authors: content.authors }
      : {}),
    ...(isArticle && content.tags?.length ? { tags: content.tags } : {}),
    // Named explicitly because the openGraph object replaces the inherited
    // one, image included. See src/lib/seo/og-image.ts.
    images: [
      {
        url: absoluteUrl(locale, OG_IMAGE_PATH),
        type: OG_IMAGE_CONTENT_TYPE,
        width: OG_IMAGE_SIZE.width,
        height: OG_IMAGE_SIZE.height,
        alt: content.imageAlt,
      },
    ],
  };
}

/**
 * hreflang map for one path: every locale that actually has the content, plus
 * x-default.
 *
 * Locales without a translation are left out completely, which is the part
 * that matters: advertising a hreflang link to a page that 404s is worse than
 * advertising none. x-default prefers the default locale (Turkish), then
 * falls back to whichever locale is available.
 *
 * Shared with src/app/sitemap.ts, which has to publish the same set: the
 * sitemap and the page head disagreeing about which languages exist is a
 * conflict a crawler resolves by trusting neither.
 */
export function buildLanguageAlternates(
  path: string,
  availableLocales: readonly Locale[],
  currentLocale?: Locale
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of availableLocales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  const fallbackLocale: Locale = availableLocales.includes(
    routing.defaultLocale
  )
    ? routing.defaultLocale
    : (availableLocales[0] ?? currentLocale ?? routing.defaultLocale);
  languages["x-default"] = absoluteUrl(fallbackLocale, path);
  return languages;
}

/**
 * canonical + hreflang set for one page. Every locale points at itself as well
 * (self referencing tag), otherwise Google discards the whole cluster.
 * Locales without translated content are left out completely. x-default
 * prefers the default locale, then falls back to whichever locale is
 * available, then to the current locale.
 */
export function buildAlternates(
  currentLocale: Locale,
  path: string,
  availableLocales: Locale[]
): {
  canonical: string;
  languages: Record<string, string>;
  types: { "application/rss+xml": { url: string; title: string }[] };
} {
  return {
    canonical: absoluteUrl(currentLocale, path),
    languages: buildLanguageAlternates(path, availableLocales, currentLocale),
    // Next replaces a child segment's alternates wholesale, so a types entry
    // declared only on the layout never reaches pages that set their own
    // alternates. Returning it here means every page that calls
    // buildAlternates (directly or through buildPageMetadata) advertises the
    // feed of its own locale.
    types: {
      "application/rss+xml": [
        {
          url: absoluteUrl(currentLocale, "/feed.xml"),
          title: siteConfig.person.name,
        },
      ],
    },
  };
}
