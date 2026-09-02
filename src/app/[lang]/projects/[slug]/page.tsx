import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { MDXContent } from "@/components/content/mdx-content";
import { mdxComponents } from "@/components/content/mdx-components";
import { JsonLd } from "@/components/seo/json-ld";
import { PageSection } from "@/components/layout/page-section";
import { ShareCard } from "@/components/sections/share-card";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/brand-icon";
import { SkillTag } from "@/components/ui/skill-tag";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProject, getProjectLocales, getProjectSlugs } from "@/lib/content";
import {
  buildBreadcrumbList,
  buildProjectCreativeWork,
} from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/site-config";
import { ogImagePathFor } from "@/lib/seo/og-image";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocaleAndSlug } from "@/lib/route-params";

interface ProjectPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getProjectSlugs(lang).map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { locale, slug } = await resolveLocaleAndSlug(params);

  const project = getProject(locale, slug);
  if (!project) notFound();

  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata(locale, `/projects/${slug}`, {
    title: project.title,
    description: project.summary,
    availableLocales: getProjectLocales(slug),
    type: "article",
    ...(project.updated ? { modifiedTime: project.updated } : {}),
    authors: [siteConfig.person.name],
    tags: project.stack,
    // This page has an opengraph-image.tsx of its own; without naming it the
    // openGraph object here would keep pointing at the identity card.
    imagePath: ogImagePathFor(`/projects/${slug}`),
    // Same reason as the blog card: the alt has to name the title the image
    // actually shows.
    imageAlt: tMeta("ogAltPage", { title: project.title }),
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await resolveLocaleAndSlug(params);
  setRequestLocale(locale);

  const project = getProject(locale, slug);
  if (!project) notFound();

  const t = await getTranslations({ locale, namespace: "projects" });

  const structuredData = buildProjectCreativeWork(locale, project);

  const breadcrumb = buildBreadcrumbList(locale, [
    { name: t("title"), path: "/projects" },
    { name: project.title, path: `/projects/${slug}` },
  ]);

  return (
    <PageSection as="article">
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumb} />
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
          <dd>
            <ul className="flex flex-wrap gap-1.5">
              {project.stack.map((item) => (
                <li key={item}>
                  <SkillTag label={item} />
                </li>
              ))}
            </ul>
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
                <GithubIcon className="size-4" />
                {t("viewSource")}
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}

      {project.cover ? (
        <Image
          src={project.cover.src}
          // An empty alt marks the cover as decorative, which is what it is
          // when the frontmatter says nothing about it: repeating the title
          // that the h1 above already carries only makes a screen reader say
          // the same words twice.
          alt={project.coverAlt ?? ""}
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
        <MDXContent code={project.code} components={mdxComponents} />
      </div>

      <ShareCard
        locale={locale}
        path={`/projects/${slug}`}
        title={project.title}
      />

      <ContactCta scope="project" />
    </PageSection>
  );
}
