import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { ProjectList } from "@/components/sections/project-list";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/seo/breadcrumb";
import { routing } from "@/i18n/routing";
import { getProjects, toProjectCardData } from "@/lib/content";
import { absoluteUrl, contentUrl } from "@/lib/seo/alternates";
import { buildCollectionPage } from "@/lib/seo/jsonld";
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

  // Same order and titles the cards below render, each linking to its project.
  const collection = buildCollectionPage(locale, {
    name: t("title"),
    description: t("description"),
    url: absoluteUrl(locale, "/projects"),
    items: projects.map((project) => ({
      name: project.title,
      url: contentUrl(locale, "project", project.slug),
    })),
  });

  return (
    <PageSection>
      <JsonLd data={collection} />
      <Breadcrumb locale={locale} items={[{ name: t("title") }]} />
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
