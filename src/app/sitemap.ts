import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getPostLocales,
  getPosts,
  getProjectLocales,
  getProjects,
  type Locale,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";

const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/projects", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
];

function languagesFor(
  path: string,
  locales: readonly Locale[]
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  const fallbackLocale: Locale = locales.includes("en")
    ? "en"
    : (locales[0] ?? routing.defaultLocale);
  languages["x-default"] = absoluteUrl(fallbackLocale, path);
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of STATIC_PAGES) {
    for (const locale of routing.locales) {
      entries.push({
        url: absoluteUrl(locale, page.path),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: languagesFor(page.path, routing.locales) },
      });
    }
  }

  for (const locale of routing.locales) {
    for (const project of getProjects(locale)) {
      const path = `/projects/${project.slug}`;
      // getProjects(locale) already returns only projects that exist for this
      // locale, so no skip step is needed here. The alternates set still has
      // to come from getProjectLocales, not routing.locales, because a
      // project translated into only one locale must not advertise a hreflang
      // link that 404s.
      entries.push({
        url: absoluteUrl(locale, path),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: languagesFor(path, getProjectLocales(project.slug)),
        },
      });
    }

    for (const post of getPosts(locale)) {
      const path = `/blog/${post.slug}`;
      entries.push({
        url: absoluteUrl(locale, path),
        lastModified: new Date(post.date),
        changeFrequency: "yearly",
        priority: 0.6,
        alternates: {
          languages: languagesFor(path, getPostLocales(post.slug)),
        },
      });
    }
  }

  return entries;
}
