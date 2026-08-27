import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import type { Locale } from "@/lib/content";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";

// Phase 0's env layer is the single site-url gate. Re-exported here so SEO
// callers read it from one module.
export { siteUrl };

/**
 * Locale prefixed pathname. The default locale (en) stays on the root because
 * routing uses localePrefix "as-needed".
 */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const trimmed = normalized === "/" ? "" : normalized.replace(/\/+$/, "");
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${trimmed}` || "/";
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
  }
): NonNullable<Metadata["openGraph"]> {
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
    ...(content.publishedTime ? { publishedTime: content.publishedTime } : {}),
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
 * canonical + hreflang set for one page. Every locale points at itself as well
 * (self referencing tag), otherwise Google discards the whole cluster.
 * Locales without translated content are left out completely. x-default
 * prefers english, then falls back to whichever locale is available, then to
 * the current locale.
 */
export function buildAlternates(
  currentLocale: Locale,
  path: string,
  availableLocales: Locale[]
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const locale of availableLocales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  const fallbackLocale: Locale = availableLocales.includes("en")
    ? "en"
    : (availableLocales[0] ?? currentLocale);
  languages["x-default"] = absoluteUrl(fallbackLocale, path);

  return {
    canonical: absoluteUrl(currentLocale, path),
    languages,
  };
}
