import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getPosts,
  getProjects,
  postSlugsByKey,
  projectSlugsByKey,
} from "@/lib/content";
import {
  absoluteUrl,
  buildLanguageAlternates,
  contentUrl,
  contentUrlsByKey,
  staticLanguageUrls,
} from "@/lib/seo/alternates";

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
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

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
        alternates: {
          languages: buildLanguageAlternates(staticLanguageUrls(page.path)),
        },
      });
    }
  }

  for (const locale of routing.locales) {
    for (const project of getProjects(locale)) {
      // getProjects(locale) already returns only projects that exist for this
      // locale, so no skip step is needed here. contentUrlsByKey reads the
      // same per-locale slug map the page head uses (projectSlugsByKey), so a
      // project translated into only one locale cannot advertise a hreflang
      // link that 404s.
      entries.push({
        url: contentUrl(locale, "project", project.slug),
        // Content date, not build time. A project without an `updated` field
        // in frontmatter has no known revision date, so it carries none.
        ...(project.updated ? { lastModified: new Date(project.updated) } : {}),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: buildLanguageAlternates(
            contentUrlsByKey(
              "project",
              projectSlugsByKey(project.translationKey)
            )
          ),
        },
      });
    }

    for (const post of getPosts(locale)) {
      entries.push({
        url: contentUrl(locale, "post", post.slug),
        lastModified: new Date(post.updated ?? post.date),
        changeFrequency: "yearly",
        priority: 0.6,
        alternates: {
          languages: buildLanguageAlternates(
            contentUrlsByKey("post", postSlugsByKey(post.translationKey))
          ),
        },
      });
    }
  }

  return entries;
}
