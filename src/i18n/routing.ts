import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for locale routing.
 *
 * localePrefix "as-needed" keeps English on the root (/, /about) and puts
 * Turkish under /tr (/tr, /tr/about). Automatic locale detection and the
 * NEXT_LOCALE cookie are both disabled on purpose: the URL is the only
 * signal that decides the language, so every page stays cacheable and
 * crawlable. See docs/04-i18n.md.
 */
export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
