import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { routing, type AppLocale } from "@/i18n/routing";
import { CV_PATHS } from "@/lib/site";

export { CV_PATHS } from "@/lib/site";

/**
 * Server side only, evaluated at build time during static prerender. A locale
 * is listed only while its PDF is present under public/cv, so a download
 * button never renders as a broken link and a missing edition simply drops
 * out of the About page and the sitemap.
 */
export function hasCv(locale: AppLocale): boolean {
  return existsSync(join(process.cwd(), "public", CV_PATHS[locale]));
}

/**
 * The locales with a CV on disk, current page locale first. The About page
 * renders the first as the primary button and the rest as secondary ones, so
 * a Turkish reader sees the Turkish PDF first and the English one beside it.
 */
export function availableCvLocales(current: AppLocale): AppLocale[] {
  const ordered = [current, ...routing.locales.filter((l) => l !== current)];
  return ordered.filter(hasCv);
}
