import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectGrid } from "@/components/sections/project-grid";
import { routing } from "@/i18n/routing";
import { getProjects, toProjectCardData, type Locale } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

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

  const t = await getTranslations({ locale: lang, namespace: "projects" });

  return buildPageMetadata(lang, "/projects", {
    title: t("title"),
    description: t("description"),
    availableLocales: [...routing.locales],
  });
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: "projects" });
  const projects = getProjects(lang as Locale).map(toProjectCardData);

  return (
    <section className="section-space">
      <div className="page-shell space-y-10">
        <header className="max-w-2xl space-y-4">
          <h1 className="text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="section-copy">{t("description")}</p>
        </header>
        <ProjectGrid projects={projects} headingLevel="h2" />
      </div>
    </section>
  );
}
