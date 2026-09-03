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
  "/projects/[slug]": {
    tr: "/projeler/[slug]",
    en: "/projects/[slug]",
  },
  // The per page OpenGraph routes have to be listed too, not as a nicety:
  // next-intl only rewrites what this map contains. An unlisted
  // /projeler/x/opengraph-image/default falls into the generic branch, gets
  // rewritten to /tr/projeler/... and 404s, because the file route is
  // /[lang]/projects/[slug]/opengraph-image/[__metadata_id__].
  "/projects/[slug]/opengraph-image/[id]": {
    tr: "/projeler/[slug]/opengraph-image/[id]",
    en: "/projects/[slug]/opengraph-image/[id]",
  },
  "/blog": {
    tr: "/yazilar",
    en: "/blog",
  },
  "/blog/[slug]": {
    tr: "/yazilar/[slug]",
    en: "/blog/[slug]",
  },
  "/blog/[slug]/opengraph-image/[id]": {
    tr: "/yazilar/[slug]/opengraph-image/[id]",
    en: "/blog/[slug]/opengraph-image/[id]",
  },
  "/contact": {
    tr: "/iletisim",
    en: "/contact",
  },
  "/services": {
    tr: "/hizmetler",
    en: "/services",
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
  // The only source of hreflang is the HTML <head> that buildAlternates
  // fills. next-intl's HTTP Link: rel=alternate header builds the other
  // locale's URL by putting the current param value into the target
  // template, so once the detail templates are localized a Turkish slug
  // gets announced under the English template: /en/blog/<tr-slug>, a 404,
  // and it contradicts the set the page publishes in its head. Two
  // conflicting hreflang sources make Google drop the whole set. It would
  // also announce a locale for content that has no translation there, the
  // opposite of the no-fallback policy. See docs/04-i18n.md.
  alternateLinks: false,
  pathnames,
});

export type AppLocale = (typeof routing.locales)[number];
