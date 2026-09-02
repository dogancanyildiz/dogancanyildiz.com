import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import { defineCollection, defineConfig, s } from "velite";
import type { MdxOptions } from "velite";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// A translationKey is a slug too: it lands in the feed guid (tag URI) and, in
// a fixture path, in a filename, so the same character set applies.
const TRANSLATION_KEY_PATTERN = SLUG_PATTERN;

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

/** Words a reader gets through in a minute. velite's own default. */
const WORDS_PER_MINUTE = 265;

/**
 * A word: letters or digits, optionally joined by an apostrophe or a hyphen.
 * Unicode aware on purpose, see readingMetadata.
 */
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/**
 * Word count and reading time for a post body.
 *
 * velite's s.metadata() counts words with an ASCII only pattern, so every
 * Turkish letter splits a word in two: "Türkiye" counts as "T" plus "rkiye".
 * The Turkish posts came out 40 to 47 percent longer than they are, and that
 * number is published as `wordCount` in the BlogPosting JSON-LD and drives the
 * reading time shown on the post. Counting with a Unicode class treats a word
 * as one word in both languages.
 */
export function readingMetadata(plain: string): {
  readingTime: number;
  wordCount: number;
} {
  const wordCount = (plain.match(WORD) ?? []).length;
  return {
    wordCount,
    readingTime: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
  };
}

const projects = defineCollection({
  name: "Project",
  pattern: "projects/**/*.mdx",
  schema: s
    .object({
      title: s.string().min(1).max(120),
      slug: s.string().regex(SLUG_PATTERN),
      // The locale independent identity of this project. Two files that
      // describe the same project (one per locale) share this value even
      // when their slugs differ; the sitemap, hreflang set and language
      // switcher key off it instead of off the slug.
      translationKey: s.string().regex(TRANSLATION_KEY_PATTERN),
      // Slugs this file used to publish under, in this locale. Only set when
      // a slug actually changed; feeds the legacy redirect table's tests so
      // the history behind a 308 stays next to the content it redirects to.
      legacySlugs: s.array(s.string().regex(SLUG_PATTERN)).default([]),
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
      // See the matching comment on the project schema above.
      translationKey: s.string().regex(TRANSLATION_KEY_PATTERN),
      legacySlugs: s.array(s.string().regex(SLUG_PATTERN)).default([]),
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
      // Kept for its validation (an empty body is a schema error) and for the
      // field type; the counts themselves are replaced below.
      metadata: s.metadata(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(data.path),
      metadata: readingMetadata(meta.plain ?? ""),
    })),
});

// Exported so the test fixtures (tests/fixtures/velite.invalid.config.ts,
// velite.invalid-links.config.ts, velite.schema-fields.config.ts) can reuse
// the real collections and mdx pipeline without duplicating the schema. Each
// fixture writes to its own output directory, so the real .velite output is
// never touched by a test run.
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
export function findDuplicateLocaleSlugPairs(
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

/**
 * Same idea as findDuplicateLocaleSlugPairs, but for translationKey: two
 * files in the same locale claiming the same key leaves the language
 * switcher and the sitemap unable to tell which one is the translation of
 * what, since both would answer to the same lookup.
 */
export function findDuplicateLocaleKeyPairs(
  items: Array<{ locale: string; translationKey: string }>
): string[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = `${item.locale}/${item.translationKey}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

/**
 * An entry whose own legacySlugs lists its own current slug. Almost always a
 * copy paste mistake (the slug was changed but the old value was duplicated
 * into legacySlugs instead of moved there), and it would otherwise surface as
 * the far less specific "shadows a live page" message from
 * findLegacySlugConflicts, since a slug is always live against itself.
 */
export function findSelfReferencingLegacySlugs(
  items: Array<{ locale: string; slug: string; legacySlugs: string[] }>
): string[] {
  return items
    .filter((item) => item.legacySlugs.includes(item.slug))
    .map((item) => `${item.locale}/${item.slug}`);
}

/**
 * A legacySlugs entry that collides with a slug some file in the same
 * collection and locale is publishing right now. A redirect table built from
 * legacySlugs would send a visitor straight past that live page.
 *
 * Excludes the self reference case: that one gets its own, clearer message
 * from findSelfReferencingLegacySlugs instead of this function's generic one.
 */
export function findLegacySlugConflicts(
  items: Array<{ locale: string; slug: string; legacySlugs: string[] }>
): string[] {
  const hits = new Set<string>();
  for (const item of items) {
    const liveSlugsInLocale = new Set(
      items
        .filter((other) => other.locale === item.locale && other !== item)
        .map((other) => other.slug)
    );
    for (const legacy of item.legacySlugs) {
      if (legacy === item.slug) continue;
      if (liveSlugsInLocale.has(legacy)) {
        hits.add(`${item.locale}/${legacy} (from ${item.slug})`);
      }
    }
  }
  return [...hits];
}

/** The shape every prepare-time check below needs from one collection entry. */
interface CheckableEntry {
  locale: string;
  slug: string;
  translationKey: string;
  legacySlugs: string[];
}

/**
 * Runs every cross-entry content invariant and throws once with every
 * violation found, rather than stopping at the first.
 *
 * Exported (not inlined into defineConfig below) so a fixture config can
 * reuse the exact same rules against a fixture content root instead of
 * against the real one; see tests/fixtures/velite.duplicate-key.config.ts.
 */
export function prepareContent(data: {
  projects: CheckableEntry[];
  posts: CheckableEntry[];
}): void {
  const errors: string[] = [];

  const duplicateProjectSlugs = findDuplicateLocaleSlugPairs(data.projects);
  const duplicatePostSlugs = findDuplicateLocaleSlugPairs(data.posts);
  if (duplicateProjectSlugs.length > 0 || duplicatePostSlugs.length > 0) {
    const parts: string[] = [];
    if (duplicateProjectSlugs.length > 0) {
      parts.push(`projects: ${duplicateProjectSlugs.join(", ")}`);
    }
    if (duplicatePostSlugs.length > 0) {
      parts.push(`posts: ${duplicatePostSlugs.join(", ")}`);
    }
    errors.push(
      `Duplicate locale/slug pairs found in content collections - ${parts.join("; ")}`
    );
  }

  const duplicateProjectKeys = findDuplicateLocaleKeyPairs(data.projects);
  const duplicatePostKeys = findDuplicateLocaleKeyPairs(data.posts);
  if (duplicateProjectKeys.length > 0 || duplicatePostKeys.length > 0) {
    const parts: string[] = [];
    if (duplicateProjectKeys.length > 0) {
      parts.push(`projects: ${duplicateProjectKeys.join(", ")}`);
    }
    if (duplicatePostKeys.length > 0) {
      parts.push(`posts: ${duplicatePostKeys.join(", ")}`);
    }
    errors.push(
      `Duplicate locale/translationKey pairs found in content collections - ${parts.join("; ")}`
    );
  }

  const selfRefProjects = findSelfReferencingLegacySlugs(data.projects);
  const selfRefPosts = findSelfReferencingLegacySlugs(data.posts);
  if (selfRefProjects.length > 0 || selfRefPosts.length > 0) {
    const parts: string[] = [];
    if (selfRefProjects.length > 0) {
      parts.push(`projects: ${selfRefProjects.join(", ")}`);
    }
    if (selfRefPosts.length > 0) {
      parts.push(`posts: ${selfRefPosts.join(", ")}`);
    }
    errors.push(
      `legacySlugs lists its own current slug (copy paste mistake, remove it) - ${parts.join("; ")}`
    );
  }

  const conflictProjects = findLegacySlugConflicts(data.projects);
  const conflictPosts = findLegacySlugConflicts(data.posts);
  if (conflictProjects.length > 0 || conflictPosts.length > 0) {
    const parts: string[] = [];
    if (conflictProjects.length > 0) {
      parts.push(`projects: ${conflictProjects.join(", ")}`);
    }
    if (conflictPosts.length > 0) {
      parts.push(`posts: ${conflictPosts.join(", ")}`);
    }
    errors.push(
      `legacySlugs shadows a live page in the same locale - ${parts.join("; ")}`
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
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
  prepare: prepareContent,
});
