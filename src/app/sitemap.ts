import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getPostLocales,
  getPosts,
  getProjectLocales,
  getProjects,
} from "@/lib/content";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo/alternates";

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

// Same helper the page head uses, so the sitemap and the hreflang tags can
// never advertise a different set of languages for the same path.
const languagesFor = buildLanguageAlternates;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // No lastModified on the static pages. It used to be the build timestamp,
  // which told a crawler that all ten of them changed on every deploy, even a
  // deploy that only bumped a dependency. An omitted lastmod is a fact; a
  // wrong one costs trust in the whole file.
  for (const page of STATIC_PAGES) {
    for (const locale of routing.locales) {
      entries.push({
        url: absoluteUrl(locale, page.path),
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
        // Content date, not build time. A project without an `updated` field
        // in frontmatter has no known revision date, so it carries none.
        ...(project.updated ? { lastModified: new Date(project.updated) } : {}),
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
        lastModified: new Date(post.updated ?? post.date),
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
