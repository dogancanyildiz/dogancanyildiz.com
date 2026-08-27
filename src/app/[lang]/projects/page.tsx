import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/locale-url";
import { ProjectsSection } from "@/components/sections/projects-section";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: t("projectsTitle"),
    description: t("projectsDescription"),
    alternates: buildAlternates(lang, "/projects"),
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <ProjectsSection />;
}
