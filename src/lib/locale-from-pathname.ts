import { routing, type AppLocale } from "@/i18n/routing";

/** Derives the document locale from a pathname (/tr/... -> tr, else default). */
export function localeFromPathname(pathname: string): AppLocale {
  if (pathname === "/tr" || pathname.startsWith("/tr/")) {
    return "tr";
  }
  return routing.defaultLocale;
}
