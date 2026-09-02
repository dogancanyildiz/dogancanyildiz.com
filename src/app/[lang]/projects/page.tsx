import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { ProjectList } from "@/components/sections/project-list";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { routing } from "@/i18n/routing";
import { getProjects, toProjectCardData } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "projects" });

  return buildPageMetadata(
    locale,
    { kind: "static", path: "/projects" },
    {
      title: t("title"),
      description: t("description"),
    }
  );
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "projects" });
  const projects = getProjects(locale).map(toProjectCardData);

  return (
    <PageSection>
      <PageHeader as="h1" title={t("title")} description={t("description")} />
      {projects.length > 0 ? (
        <ProjectList projects={projects} />
      ) : (
        <p className="section-copy">{t("empty")}</p>
      )}
      <ContactCta scope="project" />
    </PageSection>
  );
}
