import { posts, projects } from "#site/content";
import { contentHref } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

export type Locale = AppLocale;
export type Project = (typeof projects)[number];
export type Post = (typeof posts)[number];
export type ContentKind = "post" | "project";

export interface CoverImage {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface ProjectCardData {
  slug: string;
  title: string;
  summary: string;
  role: string;
  stack: string[];
  year: number;
  outcome: string;
  liveUrl: string | null;
  repoUrl: string | null;
  cover: CoverImage | null;
}

export interface PostCardData {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  readingTime: number;
}

/**
 * Drafts are authored and reviewed with `next dev` and never reach a
 * production build, a sitemap entry or the rss feed. Read per call rather
 * than captured at module scope so a test can flip NODE_ENV and observe the
 * production behaviour.
 */
function includeDrafts(): boolean {
  return process.env.NODE_ENV === "development";
}

function byProjectOrder(a: Project, b: Project): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.year !== b.year) return b.year - a.year;
  return a.title.localeCompare(b.title, "en");
}

function byPostDateDesc(a: Post, b: Post): number {
  return b.date.localeCompare(a.date);
}

function toCover(cover: Project["cover"] | Post["cover"]): CoverImage | null {
  if (!cover) return null;
  return {
    src: cover.src,
    width: cover.width,
    height: cover.height,
    blurDataURL: cover.blurDataURL,
  };
}

export function getProjects(locale: Locale): Project[] {
  return projects
    .filter(
      (project) =>
        project.locale === locale && (includeDrafts() || !project.draft)
    )
    .sort(byProjectOrder);
}

export function getFeaturedProjects(locale: Locale): Project[] {
  return getProjects(locale).filter((project) => project.featured);
}

/** How many projects the home page shows when nothing is flagged featured. */
export const HOME_PROJECT_FALLBACK_COUNT = 3;

/**
 * Projects for the home page: the ones marked `featured` in frontmatter, or
 * the first few by list order when nothing is marked.
 *
 * Without the filter the home page just repeats the projects page, which is
 * what it used to do. Without the fallback a content edit that clears the last
 * `featured: true` would silently empty the section instead. It lives here
 * rather than inside the page component so the rule can be tested against a
 * synthetic collection.
 */
export function getHomeProjects(
  locale: Locale,
  limit: number = HOME_PROJECT_FALLBACK_COUNT
): Project[] {
  const featured = getFeaturedProjects(locale);
  return featured.length > 0 ? featured : getProjects(locale).slice(0, limit);
}

export function getProject(locale: Locale, slug: string): Project | undefined {
  return getProjects(locale).find((project) => project.slug === slug);
}

export function getProjectSlugs(locale: Locale): string[] {
  return getProjects(locale).map((project) => project.slug);
}

/** The project with this translationKey in this locale, if any. */
export function getProjectByKey(
  locale: Locale,
  key: string
): Project | undefined {
  return getProjects(locale).find((project) => project.translationKey === key);
}

/**
 * Locales that actually carry a translation of this key.
 *
 * Named ...ByKey rather than reusing getProjectLocales(slug: string) on
 * purpose (R-4 in the localized paths plan): the old name took a slug and
 * most projects have the same slug in both locales, so a stale call site
 * passing a slug would still compile and silently return the wrong set only
 * for the projects whose slug differs per locale. The new name makes the
 * parameter's meaning part of the signature, so every call site had to be
 * looked at once when this changed.
 */
export function getProjectLocalesByKey(key: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of routing.locales) {
    if (getProjectByKey(locale, key)) locales.push(locale);
  }
  return locales;
}

export function getPosts(locale: Locale): Post[] {
  return posts
    .filter(
      (post) => post.locale === locale && (includeDrafts() || !post.draft)
    )
    .sort(byPostDateDesc);
}

export function getPost(locale: Locale, slug: string): Post | undefined {
  return getPosts(locale).find((post) => post.slug === slug);
}

export function getPostSlugs(locale: Locale): string[] {
  return getPosts(locale).map((post) => post.slug);
}

/** The post with this translationKey in this locale, if any. */
export function getPostByKey(locale: Locale, key: string): Post | undefined {
  return getPosts(locale).find((post) => post.translationKey === key);
}

/** See the comment on getProjectLocalesByKey; same rename, same reason. */
export function getPostLocalesByKey(key: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of routing.locales) {
    if (getPostByKey(locale, key)) locales.push(locale);
  }
  return locales;
}

/** Every locale's slug for a translationKey; a locale with no translation is absent. */
export function slugsByKey(
  kind: ContentKind,
  key: string
): Partial<Record<Locale, string>> {
  const result: Partial<Record<Locale, string>> = {};
  for (const locale of routing.locales) {
    const item =
      kind === "post"
        ? getPostByKey(locale, key)
        : getProjectByKey(locale, key);
    if (item) result[locale] = item.slug;
  }
  return result;
}

export function postSlugsByKey(key: string): Partial<Record<Locale, string>> {
  return slugsByKey("post", key);
}

export function projectSlugsByKey(
  key: string
): Partial<Record<Locale, string>> {
  return slugsByKey("project", key);
}

/**
 * Where each content page of `locale` lives in every locale that has it.
 *
 * Shape: kind -> this locale's slug -> target locale -> that locale's public
 * path. The current locale is in the map too, because the switcher renders a
 * link for it as well and that link has to stay on the page the visitor is
 * reading rather than drop to the section root.
 *
 * This replaces getUntranslatedPaths, which listed the content paths missing
 * from a locale and let the switcher keep the current path whenever it was
 * not on the list. That worked only while a translation shared its slug
 * across locales. It no longer does: /yazilar/coolify-ile-kendi-sunucumda and
 * /en/blog/self-hosting-with-coolify are one post and share no segment, so a
 * path can neither be looked up nor reused as the other locale's path. A
 * missing translation is now the absence of an entry, so the "is it missing"
 * answer and the "where is it" answer can no longer disagree.
 *
 * The draft filter applies through getPosts / getProjects on both sides.
 */
export type TranslationMap = Record<
  ContentKind,
  Record<string, Record<string, string>>
>;

export function buildTranslationMap(locale: Locale): TranslationMap {
  const map: TranslationMap = { post: {}, project: {} };

  for (const kind of ["post", "project"] as const) {
    const entries = kind === "post" ? getPosts(locale) : getProjects(locale);
    for (const entry of entries) {
      const slugs = slugsByKey(kind, entry.translationKey);
      const targets: Record<string, string> = {};
      for (const target of routing.locales) {
        const slug = slugs[target];
        if (slug) targets[target] = contentHref(target, kind, slug);
      }
      map[kind][entry.slug] = targets;
    }
  }

  return map;
}

export function toProjectCardData(project: Project): ProjectCardData {
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    stack: project.stack,
    year: project.year,
    outcome: project.outcome,
    liveUrl: project.links.live ?? null,
    repoUrl: project.links.repo ?? null,
    cover: toCover(project.cover),
  };
}

/**
 * Reading time in whole minutes, never below one.
 *
 * velite's metadata carries a fractional estimate. The list card and the post
 * header both show it and each used to round it on its own, which is one edit
 * away from the two disagreeing about the same post.
 */
export function readingMinutes(post: {
  metadata: { readingTime: number };
}): number {
  return Math.max(1, Math.round(post.metadata.readingTime));
}

export function toPostCardData(post: Post): PostCardData {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    date: post.date,
    tags: post.tags,
    readingTime: readingMinutes(post),
  };
}
