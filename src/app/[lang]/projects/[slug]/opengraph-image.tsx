import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getProject, getProjectSlugs } from "@/lib/content";
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
    getProjectSlugs(lang).map((slug) => ({ lang, slug }))
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
  const project = getProject(locale, slug);
  // The alt has to describe the card that is actually served, and this one
  // leads with the project title. The enumeration call has no real slug.
  const alt = project ? t("ogAltPage", { title: project.title }) : t("ogAlt");
  return [{ id: OG_IMAGE_ID, size, contentType, alt }];
}

/**
 * The card a shared project gets. See the blog sibling for why the page's
 * generateMetadata has to name this path explicitly.
 */
export default async function ProjectOGImage({
  params,
}: {
  params: ImageParams;
}) {
  const { locale, slug } = await resolveParams(params);
  const project = getProject(locale, slug);
  // Same gate as the blog card, for the same reason: without it any path
  // under /projects answered 200 with its own slug drawn into the prompt.
  // See that file for why dynamicParams cannot do this job.
  if (!project) notFound();
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCard
      locale={locale}
      prompt={`$ cat projects/${slug}.md`}
      title={project.title}
    />,
    { ...size, fonts }
  );
}
