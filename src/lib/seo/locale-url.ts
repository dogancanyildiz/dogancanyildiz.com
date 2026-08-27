import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";

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
