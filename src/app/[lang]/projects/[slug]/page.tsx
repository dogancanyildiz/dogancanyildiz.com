import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { MDXContent } from "@/components/content/mdx-content";
import { JsonLd } from "@/components/seo/json-ld";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getProject,
  getProjectLocales,
  getProjectSlugs,
  type Locale,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";
import { siteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

interface ProjectPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getProjectSlugs(lang as Locale).map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const project = getProject(lang, slug);
  if (!project) notFound();

  return buildPageMetadata(lang, `/projects/${slug}`, {
    title: project.title,
    description: project.summary,
    availableLocales: getProjectLocales(slug),
    type: "article",
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const project = getProject(lang as Locale, slug);
  if (!project) notFound();

  const t = await getTranslations({ locale: lang, namespace: "projects" });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    abstract: project.summary,
    inLanguage: lang,
    dateCreated: String(project.year),
    keywords: project.stack.join(", "),
    url: absoluteUrl(lang as Locale, `/projects/${slug}`),
    creator: {
      "@type": "Person",
      name: siteConfig.person.name,
      url: absoluteUrl("en", "/"),
    },
  };

  return (
    <PageSection as="article">
      <JsonLd data={structuredData} />
      <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>

        <header className="space-y-4">
          <h1 className="page-title">{project.title}</h1>
          <p className="section-copy">{project.summary}</p>
        </header>

        <dl className="grid gap-x-8 gap-y-4 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <dt className="meta-label">{t("role")}</dt>
            <dd className="text-sm text-foreground">{project.role}</dd>
          </div>
          <div className="space-y-1">
            <dt className="meta-label">{t("stack")}</dt>
            <dd className="text-sm text-foreground">
              {project.stack.join(" · ")}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="meta-label">{t("year")}</dt>
            <dd className="text-sm text-foreground">{project.year}</dd>
          </div>
          <div className="space-y-1">
            <dt className="meta-label">{t("outcome")}</dt>
            <dd className="text-sm text-foreground">{project.outcome}</dd>
          </div>
        </dl>

        {project.links.live || project.links.repo ? (
          <div className="flex flex-wrap gap-3">
            {project.links.live ? (
              <Button asChild size="sm">
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  {t("viewLive")}
                </a>
              </Button>
            ) : null}
            {project.links.repo ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={project.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="size-4" />
                  {t("viewSource")}
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}

        {project.cover ? (
          <Image
            src={project.cover.src}
            alt={project.title}
            width={project.cover.width}
            height={project.cover.height}
            placeholder="blur"
            blurDataURL={project.cover.blurDataURL}
            sizes="(min-width: 1024px) 72rem, 100vw"
            className="w-full rounded-lg object-cover"
            priority
          />
        ) : null}

        <div className="prose-content">
          <MDXContent code={project.code} />
        </div>

        <ContactCta />
    </PageSection>
  );
}
