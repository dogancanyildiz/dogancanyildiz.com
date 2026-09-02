import { notFound } from "next/navigation";
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
  const { locale, slug } = await resolveParams(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  const post = getPost(locale, slug);
  // The card this route draws leads with the post title, so the identity alt
  // would describe an image that is no longer on it. The enumeration call
  // arrives without a real slug, and then the identity line is all there is.
  const alt = post ? t("ogAltPage", { title: post.title }) : t("ogAlt");
  return [{ id: OG_IMAGE_ID, size, contentType, alt }];
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
  // The gate on what this route will draw, and the only one available.
  //
  // Left to fall back (`post?.title`), the card answered 200 for any path
  // under /blog, including one whose page 404s, with the requested slug drawn
  // verbatim into the prompt line above the owner's name: the text on a card
  // served from his own domain became the caller's to choose. notFound() runs
  // before the fonts are read, so an unknown slug costs a lookup rather than a
  // satori render.
  //
  // `dynamicParams = false` looks like the tidier fix and is not usable here:
  // Next registers no concrete path for a metadata image route in the
  // prerender manifest (only the dynamic entry), so setting it turns every
  // card, real slugs included, into a 404. Verified on next start.
  if (!post) notFound();
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCard
      locale={locale}
      prompt={`$ cat blog/${slug}.md`}
      title={post.title}
    />,
    { ...size, fonts }
  );
}
