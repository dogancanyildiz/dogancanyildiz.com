import { certificates } from "@/content/profile";
import { ogImageHref } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import type { Locale, Post, Project } from "@/lib/content";
import { absoluteUrl, contentUrl } from "@/lib/seo/alternates";
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

/**
 * The Person node's credentials, one EducationalOccupationalCredential each.
 *
 * Only the fields a consumer can act on: what the credential is called, who
 * recognizes it, when it was issued, and the issuer's own page for checking
 * it. `url` is that verification page, so a record with no working link
 * carries no url rather than a link to this site's own About section, which
 * would verify nothing. Nothing here is localized, because a credential name
 * is issued in one language and keeps it.
 */
export function buildCredentials(locale: Locale): Record<string, unknown>[] {
  return certificates[locale].map((entry) => ({
    "@type": "EducationalOccupationalCredential",
    name: entry.name,
    credentialCategory: entry.credentialCategory,
    recognizedBy: {
      "@type": "Organization",
      name: entry.issuer,
    },
    ...(entry.issued ? { dateCreated: entry.issued } : {}),
    ...(entry.verifyUrl ? { url: entry.verifyUrl } : {}),
  }));
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

export interface ListEntry {
  name: string;
  url: string;
}

/**
 * CollectionPage + ItemList for a listing page (the blog index, the projects
 * index).
 *
 * `name` and `description` are the page's own visible heading and lead, and
 * every `itemListElement` names an entry that is visible on the page, in the
 * same order it renders, so the structured list and the printed list are one
 * and the same. The ItemList is the page's `mainEntity`; the page is tied back
 * to the site through `isPartOf`, referencing the WebSite node by its shared
 * `@id` rather than repeating it.
 */
export function buildCollectionPage(
  locale: Locale,
  page: { name: string; description: string; url: string; items: ListEntry[] }
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": page.url,
    url: page.url,
    name: page.name,
    description: page.description,
    inLanguage: locale,
    isPartOf: { "@id": websiteId() },
    mainEntity: buildItemList(page.items),
  };
}

/**
 * ItemList of listing entries, numbered from one in the order given. Each
 * `ListItem` carries the entry's own url, so the list is a set of links a
 * consumer can follow rather than bare positions.
 */
export function buildItemList(items: ListEntry[]): Record<string, unknown> {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
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
 * same ogImageHref the page's openGraph uses: the two describing different
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
    image: `${siteUrl()}${ogImageHref(locale, "post", post.slug)}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": contentUrl(locale, "post", post.slug),
    },
    author,
    publisher: author,
  };
}

export interface ServiceOffer {
  name: string;
  description?: string;
}

/**
 * Service node for the services page.
 *
 * `provider` is the same Person node the rest of the graph shares, by `@id`, so
 * the offer and the human behind it are one entity. `areaServed` carries the
 * city and country the visible page names, which is the local signal a query
 * like "konya web sitesi" reads. Each offer becomes an `Offer` in a
 * `hasOfferCatalog`, named after the visible service entries on the page and
 * carrying no price: the page states a written fixed quote after scope, not a
 * number, so the structured data cannot advertise one either.
 */
export function buildServices(
  locale: Locale,
  service: {
    name: string;
    description: string;
    url: string;
    areaCity: string;
    areaCountry: string;
    offers: ServiceOffer[];
  }
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: service.url,
    inLanguage: locale,
    serviceType: service.offers.map((offer) => offer.name),
    provider: personRef(),
    areaServed: [
      { "@type": "AdministrativeArea", name: service.areaCity },
      { "@type": "Country", name: service.areaCountry },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: service.name,
      itemListElement: service.offers.map((offer) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: offer.name,
          ...(offer.description ? { description: offer.description } : {}),
        },
      })),
    },
  };
}

/**
 * FAQPage for a page that prints a question/answer list. Each entry mirrors a
 * visible `dt`/`dd` pair one to one, so the structured questions and the
 * printed ones are the same text. Google no longer shows FAQ rich results for
 * non-authoritative sites, so this earns no stars; it stays for answer engines
 * and assistants that read the graph directly.
 */
export function buildFaqPage(
  items: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
    url: contentUrl(locale, "project", project.slug),
    image: `${siteUrl()}${ogImageHref(locale, "project", project.slug)}`,
    creator: personRef(),
  };
}
