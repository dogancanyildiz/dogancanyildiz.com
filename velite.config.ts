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
      links: s
        .object({
          live: s.string().url().optional(),
          repo: s.string().url().optional(),
        })
        .default({}),
      cover: s.image().optional(),
      outcome: s.string().min(1).max(300),
      featured: s.boolean().default(false),
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
      summary: s.string().min(1).max(300),
      tags: s.array(s.string().min(1)).default([]),
      cover: s.image().optional(),
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
