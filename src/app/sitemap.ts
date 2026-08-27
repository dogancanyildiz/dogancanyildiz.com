import type { MetadataRoute } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { projects } from "@/data/projects";
import { localeUrl } from "@/lib/seo/locale-url";
import { localesForProject } from "@/lib/content/project-locales";

const STATIC_PAGES = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/projects", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: "monthly" | "yearly";
}>;

function languagesFor(
  path: string,
  availableLocales: readonly AppLocale[]
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    if (availableLocales.includes(locale)) {
      languages[locale] = localeUrl(locale, path);
    }
  }

  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: localeUrl(locale, page.path),
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: languagesFor(page.path, routing.locales) },
      });
    }

    for (const project of projects) {
      const path = `/projects/${project.slug}`;
      const availableLocales = localesForProject(project.slug);

      // A project that is not translated into this locale gets no entry and no
      // alternate; see docs/04-i18n.md "fallback sayfa yok".
      if (!availableLocales.includes(locale)) continue;

      entries.push({
        url: localeUrl(locale, path),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: languagesFor(path, availableLocales) },
      });
    }
  }

  return entries;
}
