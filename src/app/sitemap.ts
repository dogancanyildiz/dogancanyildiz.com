import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { availableCvLocales } from "@/lib/cv";
import { profileImagePath } from "@/lib/profile-image";
import { CV_PATHS } from "@/lib/site";
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
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

/**
 * Pages that show the profile photo, the About page only since the home
 * page dropped it (2026-09-08). Listing the image under the page is what
 * puts the photo in image search with that page as its landing page; the
 * Person node already names the same file as `image`.
 */
const PAGES_WITH_PORTRAIT = new Set(["/about"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const origin = siteUrl();
  const portrait = profileImagePath();

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
        ...(portrait && PAGES_WITH_PORTRAIT.has(page.path)
          ? { images: [`${origin}${portrait}`] }
          : {}),
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

  // The CV PDFs, one per locale, only while the file is on disk. A PDF is a
  // document to a crawler like any page; the file's own Title and Lang
  // metadata carry what a page would put in <head>.
  for (const cvLocale of availableCvLocales("tr")) {
    entries.push({
      url: `${origin}${CV_PATHS[cvLocale]}`,
      changeFrequency: "yearly",
      priority: 0.4,
    });
  }

  return entries;
}
