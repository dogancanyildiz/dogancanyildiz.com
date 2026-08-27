import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";

/**
 * Locale prefixed pathname. The default locale (en) stays on the root because
 * routing uses localePrefix "as-needed".
 */
export function localePath(locale: AppLocale, pathname: string): string {
  const normalized = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${normalized}` || "/";
}

export function localeUrl(locale: AppLocale, pathname: string): string {
  return `${siteUrl()}${localePath(locale, pathname)}`;
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
  locale: AppLocale,
  pathname: string,
  content: {
    title: string;
    description: string;
    siteName: string;
    imageAlt: string;
  }
): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: content.siteName,
    title: content.title,
    description: content.description,
    url: localeUrl(locale, pathname),
    locale: OG_LOCALES[locale],
    alternateLocale: routing.locales
      .filter((candidate) => candidate !== locale)
      .map((candidate) => OG_LOCALES[candidate]),
    // Named explicitly because the openGraph object replaces the inherited
    // one, image included. See src/lib/seo/og-image.ts.
    images: [
      {
        url: localeUrl(locale, OG_IMAGE_PATH),
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
 * Locales without translated content are left out completely.
 */
export function buildAlternates(
  locale: AppLocale,
  pathname: string,
  availableLocales: readonly AppLocale[] = routing.locales
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};

  for (const candidate of routing.locales) {
    if (availableLocales.includes(candidate)) {
      languages[candidate] = localeUrl(candidate, pathname);
    }
  }

  if (availableLocales.includes(routing.defaultLocale)) {
    languages["x-default"] = localeUrl(routing.defaultLocale, pathname);
  }

  return {
    canonical: localeUrl(locale, pathname),
    languages,
  };
}
