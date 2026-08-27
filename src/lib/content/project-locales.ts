import { routing, type AppLocale } from "@/i18n/routing";
import { projects } from "@/data/projects";

/**
 * Locales a project detail page exists in.
 *
 * Today every project is a single locale independent record in
 * src/data/projects.ts whose title and description are translated in
 * messages/{en,tr}.json, so a known slug exists in both locales. Faz 4 swaps
 * the body of this function for a Velite lookup over
 * content/projects/{en,tr}/<slug>.mdx; sitemap and hreflang callers do not
 * change when that happens.
 */
export function localesForProject(slug: string): AppLocale[] {
  const project = projects.find((item) => item.slug === slug);
  if (!project) return [];
  return [...routing.locales];
}
