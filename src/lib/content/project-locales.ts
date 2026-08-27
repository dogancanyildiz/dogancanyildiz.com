import { getProjectLocales } from "@/lib/content";
import type { AppLocale } from "@/i18n/routing";

/**
 * Locales a project detail page exists in.
 *
 * Delegates to the Velite backed content layer: a slug exists in a locale
 * when content/projects/<locale>/<slug>.mdx exists for it. Sitemap and
 * hreflang callers do not change when the underlying content source does.
 */
export function localesForProject(slug: string): AppLocale[] {
  return getProjectLocales(slug);
}
