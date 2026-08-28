import { posts, projects } from "#site/content";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

export type Locale = AppLocale;
export type Project = (typeof projects)[number];
export type Post = (typeof posts)[number];

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
  href: string;
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
  href: string;
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

export function getProject(locale: Locale, slug: string): Project | undefined {
  return getProjects(locale).find((project) => project.slug === slug);
}

export function getProjectSlugs(locale: Locale): string[] {
  return getProjects(locale).map((project) => project.slug);
}

export function getProjectLocales(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of routing.locales) {
    if (getProject(locale, slug)) locales.push(locale);
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

export function getPostLocales(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of routing.locales) {
    if (getPost(locale, slug)) locales.push(locale);
  }
  return locales;
}

/**
 * Content paths that exist in at least one locale but not in `locale`.
 *
 * The language switcher uses this to avoid linking to a 404: switching to a
 * locale that has no translation for the current project or post should land
 * on the section root instead of the untranslated detail page. Draft posts
 * are excluded on both sides because they come from getPostSlugs, which
 * already applies the draft filter.
 */
export function getUntranslatedPaths(locale: Locale): string[] {
  const paths: string[] = [];

  const allProjectSlugs = new Set(
    routing.locales.flatMap((candidate) => getProjectSlugs(candidate))
  );
  const translatedProjectSlugs = new Set(getProjectSlugs(locale));
  for (const slug of allProjectSlugs) {
    if (!translatedProjectSlugs.has(slug)) paths.push(`/projects/${slug}`);
  }

  const allPostSlugs = new Set(
    routing.locales.flatMap((candidate) => getPostSlugs(candidate))
  );
  const translatedPostSlugs = new Set(getPostSlugs(locale));
  for (const slug of allPostSlugs) {
    if (!translatedPostSlugs.has(slug)) paths.push(`/blog/${slug}`);
  }

  return paths.sort();
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
    href: `/projects/${project.slug}`,
    liveUrl: project.links.live ?? null,
    repoUrl: project.links.repo ?? null,
    cover: toCover(project.cover),
  };
}

export function toPostCardData(post: Post): PostCardData {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    date: post.date,
    tags: post.tags,
    readingTime: Math.max(1, Math.round(post.metadata.readingTime)),
    href: `/blog/${post.slug}`,
  };
}
