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
    absoluteTitle?: boolean;
  }
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  const siteName = t("defaultTitle");
  const imageAlt = t("ogAlt");

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    alternates: buildAlternates(locale, path, options.availableLocales),
    openGraph: buildOpenGraph(locale, path, {
      title: options.title,
      description: options.description,
      siteName,
      imageAlt,
      type: options.type,
      publishedTime: options.publishedTime,
    }),
  };
}
