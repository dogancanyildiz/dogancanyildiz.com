import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/content";
import {
  buildAlternates,
  buildOpenGraph,
  feedTitle,
} from "@/lib/seo/alternates";

/**
 * Shared metadata builder for every locale routed page. Reads the site name
 * and og image alt text from the metadata message namespace so every page
 * stops repeating that lookup, then assembles title, description, hreflang
 * alternates and the complete openGraph object in one call.
 */
export async function buildPageMetadata(
  locale: Locale,
  path: string,
  options: {
    title: string;
    description: string;
    availableLocales: Locale[];
    type?: "website" | "article";
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
    /**
     * Locale relative path of this page's own OG card, from ogImagePathFor.
     * Omitted, the page advertises the identity image on the [lang] segment.
     */
    imagePath?: string;
    /**
     * Alt text for that card. Omitted, the page advertises the identity alt,
     * which only describes the identity image; a page whose own card leads
     * with its title has to say so here or the alt describes another picture.
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

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    alternates: buildAlternates(
      locale,
      path,
      options.availableLocales,
      feedTitle(tBlog("title"))
    ),
    openGraph: buildOpenGraph(locale, path, {
      title: openGraphTitle,
      description: options.description,
      siteName,
      imageAlt,
      type: options.type,
      publishedTime: options.publishedTime,
      modifiedTime: options.modifiedTime,
      authors: options.authors,
      tags: options.tags,
      imagePath: options.imagePath,
    }),
  };
}
