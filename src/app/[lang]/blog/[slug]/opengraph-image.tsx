import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getPost, getPostSlugs } from "@/lib/content";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_ID,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";
import { loadOgFonts, OgCard } from "@/lib/seo/og-layout";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type ImageParams = Promise<{ lang: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getPostSlugs(lang).map((slug) => ({ lang, slug }))
  );
}

/**
 * Same fallback the [lang] card needs: Next calls generateImageMetadata once
 * with empty params to enumerate the ids, so `lang` cannot be handed to
 * next-intl as it arrives.
 */
async function resolveParams(paramsPromise: ImageParams) {
  const { lang, slug } = await paramsPromise;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  return { locale, slug };
}

export async function generateImageMetadata({
  params,
}: {
  params: ImageParams;
}) {
  const { locale } = await resolveParams(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return [{ id: OG_IMAGE_ID, size, contentType, alt: t("ogAlt") }];
}

/**
 * The card a shared post gets: the same layout as the identity image, with
 * the post title in the middle band and the prompt reading like the file was
 * catted. src/app/[lang]/blog/[slug]/page.tsx has to point openGraph at this
 * path (see ogImagePathFor), otherwise the post advertises the generic card.
 */
export default async function PostOGImage({ params }: { params: ImageParams }) {
  const { locale, slug } = await resolveParams(params);
  const post = getPost(locale, slug);
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCard
      locale={locale}
      prompt={`$ cat blog/${slug}.md`}
      title={post?.title}
    />,
    { ...size, fonts }
  );
}
