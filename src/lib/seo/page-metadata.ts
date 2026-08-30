import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/content";
import { buildAlternates, buildOpenGraph } from "@/lib/seo/alternates";

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
     * The title is already complete and must not be suffixed. Used by the
     * home page, whose title carries the name and the role and would read
     * "Doğan Can YILDIZ | ... | Doğan Can YILDIZ" under the template.
     */
    absoluteTitle?: boolean;
  }
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  const siteName = t("siteName");
  const imageAlt = t("ogAlt");

  // The document <title> gets the brand from the layout's title template, but
  // openGraph has no template: a raw "About" is what a share card would show.
  // Applying the same suffix here keeps the two in step.
  const openGraphTitle = options.absoluteTitle
    ? options.title
    : `${options.title} | ${siteName}`;

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    alternates: buildAlternates(locale, path, options.availableLocales),
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
    }),
  };
}
