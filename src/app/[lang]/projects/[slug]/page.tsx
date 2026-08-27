import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { projects } from "@/data/projects";
import { buildAlternates, buildOpenGraph } from "@/lib/seo/alternates";
import { localesForProject } from "@/lib/content/project-locales";
import { ProjectDetail } from "@/components/sections/project-detail";

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    projects.map((project) => ({ lang, slug: project.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};

  const t = await getTranslations({
    locale: lang,
    namespace: "projects.items",
  });
  const site = await getTranslations({ locale: lang, namespace: "metadata" });

  const title = t(`${project.id}.title`);
  const description = t(`${project.id}.description`);

  return {
    title,
    description,
    openGraph: buildOpenGraph(lang, `/projects/${slug}`, {
      title,
      description,
      siteName: site("defaultTitle"),
      imageAlt: site("ogAlt"),
    }),
    alternates: buildAlternates(
      lang,
      `/projects/${slug}`,
      localesForProject(slug)
    ),
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
