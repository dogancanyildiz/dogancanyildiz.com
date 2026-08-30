import { defineRouting } from "next-intl/routing";

/**
 * Public pathnames. Internal file routes stay English
 * (`app/[lang]/about/page.tsx`); next-intl rewrites the localized URLs onto
 * those. ASCII only: no dotted/dotless i in the slug.
 */
export const pathnames = {
  "/": "/",
  "/about": {
    tr: "/hakkimda",
    en: "/about",
  },
  "/projects": {
    tr: "/projeler",
    en: "/projects",
  },
  "/projects/[slug]": "/projects/[slug]",
  "/blog": "/blog",
  "/blog/[slug]": "/blog/[slug]",
  "/contact": {
    tr: "/iletisim",
    en: "/contact",
  },
  "/privacy": {
    tr: "/gizlilik",
    en: "/privacy",
  },
  "/coming-soon": "/coming-soon",
  "/updating": "/updating",
  "/feed.xml": "/feed.xml",
} as const;

/**
 * Single source of truth for locale routing.
 *
 * Turkish is the default locale, so it lives on the root (`/`, `/hakkimda`)
 * and English is prefixed (`/en`, `/en/about`). localePrefix "as-needed"
 * omits the prefix on the default locale and 301s a superfluous `/tr/...`
 * onto the unprefixed Turkish URL. Automatic locale detection and the
 * NEXT_LOCALE cookie stay off: the URL is the only signal, so every page
 * stays cacheable and crawlable. See docs/04-i18n.md.
 */
export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  pathnames,
});

export type AppLocale = (typeof routing.locales)[number];
