import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph } from "@/lib/seo/alternates";
import { Hero } from "@/components/sections/hero";
import { ProjectGrid } from "@/components/sections/project-grid";
import { SkillsStrip } from "@/components/sections/skills-strip";
import { PersonJsonLd } from "@/components/seo/person-jsonld";
import { Link } from "@/i18n/navigation";
import { skills } from "@/content/profile";
import {
  getFeaturedProjects,
  toProjectCardData,
  type Locale,
} from "@/lib/content";

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
    title: { absolute: t("defaultTitle") },
    description: t("defaultDescription"),
    openGraph: buildOpenGraph(lang, "/", {
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      siteName: t("defaultTitle"),
      imageAlt: t("ogAlt"),
    }),
    alternates: buildAlternates(lang, "/", [...routing.locales]),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const tHome = await getTranslations({ locale: lang, namespace: "home" });
  const featured = getFeaturedProjects(lang as Locale).map(toProjectCardData);

  return (
    <>
      <PersonJsonLd locale={lang} />
      <Hero />
      <section className="section-space">
        <div className="page-shell space-y-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl">{tHome("featuredTitle")}</h2>
            <Link
              href="/projects"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {tHome("featuredLink")}
            </Link>
          </div>
          <ProjectGrid projects={featured} />
        </div>
      </section>
      <SkillsStrip
        groups={skills[lang as Locale].filter((group) => group.featured)}
      />
    </>
  );
}
