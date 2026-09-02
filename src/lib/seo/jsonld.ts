import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import type { Locale, Post, Project } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";
import { ogImagePathFor } from "@/lib/seo/og-image";
import { siteConfig } from "@/lib/site-config";

/**
 * Stable node identifiers for the graph this site publishes.
 *
 * schema.org treats two nodes with different `@id` values as two different
 * things. Without these, the english and turkish pages each described their
 * own Person, and every article carried a third inline copy as its author, so
 * a consumer had no way to tell that all of them are the same human. The ids
 * are absolute urls with a fragment, which is the form Google documents, and
 * they are locale independent on purpose: the identity does not change with
 * the language of the page describing it.
 */
export function personId(): string {
  return `${siteUrl()}/#person`;
}

export function websiteId(): string {
  return `${siteUrl()}/#website`;
}

/**
 * Canonical url of the person and of the site as a whole.
 *
 * Deliberately pinned to the site root (the default locale) rather than the
 * current locale (F-104). `absoluteUrl(locale, "/")` would make the same
 * entity claim a different url per locale, which reintroduces the split
 * identity that the shared `@id` exists to prevent. Per page urls stay
 * locale aware; this one value is the single home of the entity.
 */
export function identityUrl(): string {
  return absoluteUrl(routing.defaultLocale, "/");
}

/**
 * Reference to the Person node, for the author, creator and publisher slots.
 * Name and url are repeated alongside the `@id` so a consumer that does not
 * resolve references still has something to show.
 */
export function personRef(): Record<string, unknown> {
  return {
    "@type": "Person",
    "@id": personId(),
    name: siteConfig.person.name,
    url: identityUrl(),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * BreadcrumbList for a detail page. `item` is left off the last entry: it is
 * the current page, and schema.org treats a trailing self link as redundant.
 */
export function buildBreadcrumbList(
  locale: Locale,
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(index === items.length - 1
        ? {}
        : { item: absoluteUrl(locale, item.path) }),
    })),
  };
}

/**
 * WebSite node for one locale. Rendered by the home page of each locale rather
 * than by the shared layout, so every subpage does not repeat it.
 *
 * `url` is `identityUrl()` and not the locale root, for the same reason the
 * Person node is pinned: one `@id` carrying two different urls is the split
 * identity the shared id exists to prevent, and a consumer merging the english
 * and turkish pages would see exactly that. The language of this particular
 * description is carried by `inLanguage` and by the localized name and
 * description, which is what actually differs between the two.
 */
export function buildWebSite(
  locale: Locale,
  name: string,
  description: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(),
    url: identityUrl(),
    name,
    description,
    inLanguage: locale,
    publisher: personRef(),
  };
}

/**
 * BlogPosting for one post.
 *
 * author and publisher are the same node, referenced by `@id` rather than
 * repeated inline: one human wrote and published it. dateModified falls back
 * to the publish date, so an untouched post never advertises a revision it
 * never had. image is the absolute url of the post's own OG card, through the
 * same ogImagePathFor the page's openGraph uses: the two describing different
 * pictures of the same page is exactly the contradiction a consumer cannot
 * resolve.
 */
export function buildBlogPosting(
  locale: Locale,
  post: Post
): Record<string, unknown> {
  const author = personRef();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    inLanguage: locale,
    keywords: post.tags.join(", "),
    wordCount: post.metadata.wordCount,
    image: absoluteUrl(locale, ogImagePathFor(`/blog/${post.slug}`)),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(locale, `/blog/${post.slug}`),
    },
    author,
    publisher: author,
  };
}

/** CreativeWork for one project, with the same shared creator node. */
export function buildProjectCreativeWork(
  locale: Locale,
  project: Project
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    abstract: project.summary,
    inLanguage: locale,
    dateCreated: String(project.year),
    ...(project.updated ? { dateModified: project.updated } : {}),
    keywords: project.stack.join(", "),
    url: absoluteUrl(locale, `/projects/${project.slug}`),
    image: absoluteUrl(locale, ogImagePathFor(`/projects/${project.slug}`)),
    creator: personRef(),
  };
}
