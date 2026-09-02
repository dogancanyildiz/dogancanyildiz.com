import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_ID,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";
import { loadOgFonts, OgCard } from "@/lib/seo/og-layout";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

// Next calls this once with empty params to enumerate the image ids, then once
// per locale while prerendering, so `lang` has to fall back to the default
// locale instead of being handed to next-intl as undefined. This is the same
// fallback Faz 2 already needed for the same reason, do not drop it.
async function resolveLocale(paramsPromise: Promise<{ lang: string }>) {
  const { lang } = await paramsPromise;
  return hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return [{ id: OG_IMAGE_ID, size, contentType, alt: t("ogAlt") }];
}

/**
 * The identity card: the one every page falls back to.
 *
 * Its middle band stays empty on purpose. There is no single page behind this
 * image, so a title there would be either the site name repeated under the
 * name that is already set in 72px, or a claim about a page the share does not
 * point at. The layout, the fonts and the satori constraints all live in
 * src/lib/seo/og-layout.tsx, shared with the two per page cards.
 */
export default async function OGImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCard locale={locale} prompt="~/dogancanyildiz $ whoami" />,
    { ...size, fonts }
  );
}
