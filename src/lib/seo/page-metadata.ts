import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ogImageHref } from "@/i18n/navigation";
import type { ContentKind, Locale } from "@/lib/content";
import {
  absoluteUrl,
  buildAlternates,
  buildOpenGraph,
  contentUrl,
  contentUrlsByKey,
  feedTitle,
  siteUrl,
  staticLanguageUrls,
} from "@/lib/seo/alternates";
import { OG_IMAGE_PATH } from "@/lib/seo/og-image";

/**
 * The fixed, non content pages this site routes. Every one of them is a
 * `pathnames` key in src/i18n/routing.ts, so absoluteUrl/staticLanguageUrls
 * can localize it without a slug.
 */
export type StaticPathname =
  | "/"
  | "/about"
  | "/projects"
  | "/blog"
  | "/contact"
  | "/services"
  | "/privacy"
  | "/coming-soon"
  | "/updating";

/**
 * The route a page's metadata describes. A static page has one internal path
 * that is the same in every locale (localization happens inside
 * pathnames); a content page has its own slug per locale, so its canonical
 * and hreflang set have to be built from that per-locale map instead.
 */
export type PageRoute =
  | { kind: "static"; path: StaticPathname }
  | {
      kind: "content";
      content: ContentKind;
      /** This content's slug per locale; a locale with no translation is absent. */
      slugs: Partial<Record<Locale, string>>;
    };

/**
 * Shared metadata builder for every locale routed page. Reads the site name
 * and og image alt text from the metadata message namespace so every page
 * stops repeating that lookup, then assembles title, description, hreflang
 * alternates and the complete openGraph object in one call.
 */
export async function buildPageMetadata(
  locale: Locale,
  route: PageRoute,
  options: {
    title: string;
    description: string;
    type?: "website" | "article";
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
    /**
     * Alt text for this page's own OG card. Omitted, the page advertises the
     * identity alt, which only describes the identity image; a page whose
     * own card leads with its title has to say so here or the alt describes
     * another picture.
     */
    imageAlt?: string;
    /**
     * The title is already complete and must not be suffixed. Used by the
     * home page, whose title carries the name and the role and would read
     * "Doğan Can YILDIZ | ... | Doğan Can YILDIZ" under the template.
     */
    absoluteTitle?: boolean;
  }
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  const siteName = t("siteName");
  const imageAlt = options.imageAlt ?? t("ogAlt");

  // The feed link every page advertises is the one of its own locale, and a
  // reader offers it by title, so the title has to be localized too.
  const tBlog = await getTranslations({ locale, namespace: "blog" });

  // The document <title> gets the brand from the layout's title template, but
  // openGraph has no template: a raw "About" is what a share card would show.
  // Applying the same suffix here keeps the two in step.
  const openGraphTitle = options.absoluteTitle
    ? options.title
    : `${options.title} | ${siteName}`;

  let canonical: string;
  let urlsByLocale: Partial<Record<Locale, string>>;
  let imageUrl: string;

  if (route.kind === "static") {
    canonical = absoluteUrl(locale, route.path);
    urlsByLocale = staticLanguageUrls(route.path);
    imageUrl = absoluteUrl(locale, OG_IMAGE_PATH);
  } else {
    const slug = route.slugs[locale];
    if (!slug) {
      throw new Error(
        `buildPageMetadata: no ${locale} slug for this ${route.content} route`
      );
    }
    canonical = contentUrl(locale, route.content, slug);
    urlsByLocale = contentUrlsByKey(route.content, route.slugs);
    imageUrl = `${siteUrl()}${ogImageHref(locale, route.content, slug)}`;
  }

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    alternates: buildAlternates(
      locale,
      canonical,
      urlsByLocale,
      feedTitle(tBlog("title"))
    ),
    openGraph: buildOpenGraph(
      locale,
      { url: canonical, imageUrl },
      {
        title: openGraphTitle,
        description: options.description,
        siteName,
        imageAlt,
        type: options.type,
        publishedTime: options.publishedTime,
        modifiedTime: options.modifiedTime,
        authors: options.authors,
        tags: options.tags,
      }
    ),
    // There is no X profile to attribute, so the card leans on the same title,
    // description and image the openGraph object already carries. Declared per
    // page rather than once on the layout because Next replaces a child's
    // openGraph wholesale, and the twitter block has to move in step with it or
    // a subpage would advertise the home card. summary_large_image matches the
    // 1200x630 openGraph image.
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle,
      description: options.description,
      images: [imageUrl],
    },
  };
}
