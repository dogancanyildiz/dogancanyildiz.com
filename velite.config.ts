import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import { defineCollection, defineConfig, s } from "velite";
import type { MdxOptions } from "velite";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// content/projects/en/cargo-pilot.mdx -> ["projects", "en", "cargo-pilot"]
function localeFromPath(path: string): "en" | "tr" {
  const segment = path.split("/")[1];
  return segment === "tr" ? "tr" : "en";
}

/**
 * Outbound link in frontmatter.
 *
 * s.string().url() alone accepts any parsable URL, javascript: and data:
 * included, and every one of these values is rendered straight into an href.
 * The repo is public, so a content pull request is a real path for such a
 * value to arrive; scripts/audit-live-links.mjs already assumes https, and the
 * schema now carries the same contract instead of trusting the author.
 */
function httpsUrl() {
  return s
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), {
      message: "must be an https:// url",
    });
}

const projects = defineCollection({
  name: "Project",
  pattern: "projects/**/*.mdx",
  schema: s
    .object({
      title: s.string().min(1).max(120),
      slug: s.string().regex(SLUG_PATTERN),
      summary: s.string().min(1).max(300),
      role: s.string().min(1).max(120),
      stack: s.array(s.string().min(1)).min(1),
      year: s.number().int().min(2015).max(2100),
      // Last substantive edit. Feeds dateModified and the sitemap lastmod, so
      // a redeploy alone never claims the entry changed.
      updated: s.isodate().optional(),
      links: s
        .object({
          live: httpsUrl().optional(),
          repo: httpsUrl().optional(),
        })
        .default({}),
      cover: s.image().optional(),
      // Empty or absent means the cover carries no information the page text
      // does not already state, and the image is rendered as decorative.
      coverAlt: s.string().min(1).max(240).optional(),
      outcome: s.string().min(1).max(300),
      featured: s.boolean().default(false),
      // Same contract as posts: a draft is visible in development and never
      // reaches a production build, a sitemap entry or the rss feed.
      draft: s.boolean().default(false),
      order: s.number().int().min(1).max(999).default(100),
      path: s.path(),
      code: s.mdx(),
    })
    .transform((data) => ({ ...data, locale: localeFromPath(data.path) })),
});

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      title: s.string().min(1).max(140),
      slug: s.string().regex(SLUG_PATTERN),
      date: s.isodate(),
      // Set only when a published post is revised. dateModified falls back to
      // date, so an untouched post never advertises a fake revision.
      updated: s.isodate().optional(),
      summary: s.string().min(1).max(300),
      tags: s.array(s.string().min(1)).default([]),
      cover: s.image().optional(),
      coverAlt: s.string().min(1).max(240).optional(),
      draft: s.boolean().default(false),
      path: s.path(),
      code: s.mdx(),
      metadata: s.metadata(),
    })
    .transform((data) => ({ ...data, locale: localeFromPath(data.path) })),
});

// Exported so a test fixture (tests/fixtures/velite.valid.config.ts) can
// reuse the real collections and mdx pipeline without duplicating the
// schema. That fixture writes to its own output directory, so the real
// .velite output is never touched by a test run.
export const collections = { projects, posts };

export const mdx: MdxOptions = {
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }],
    // MDX bodies will carry external links; this keeps them safe without editors remembering rel.
    [
      rehypeExternalLinks,
      { target: "_blank", rel: ["noopener", "noreferrer"] },
    ],
    [
      rehypeShiki,
      {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      },
    ],
  ],
};

// Same (locale, slug) pair is only a collision within one locale: an "en"
// and a "tr" file sharing a slug is the expected way to link translations,
// so only a repeat inside the same locale is an error.
function findDuplicateLocaleSlugPairs(
  items: Array<{ locale: string; slug: string }>
): string[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = `${item.locale}/${item.slug}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
  collections,
  mdx,
  prepare: (data) => {
    const duplicateProjects = findDuplicateLocaleSlugPairs(data.projects);
    const duplicatePosts = findDuplicateLocaleSlugPairs(data.posts);
    if (duplicateProjects.length > 0 || duplicatePosts.length > 0) {
      const parts: string[] = [];
      if (duplicateProjects.length > 0) {
        parts.push(`projects: ${duplicateProjects.join(", ")}`);
      }
      if (duplicatePosts.length > 0) {
        parts.push(`posts: ${duplicatePosts.join(", ")}`);
      }
      throw new Error(
        `Duplicate locale/slug pairs found in content collections - ${parts.join("; ")}`
      );
    }
  },
});
