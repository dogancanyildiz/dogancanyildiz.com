import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { MDXContent } from "@/components/content/mdx-content";
import { mdxComponents } from "@/components/content/mdx-components";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/seo/breadcrumb";
import { PageSection } from "@/components/layout/page-section";
import { ShareCard } from "@/components/sections/share-card";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/brand-icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { SkillTag } from "@/components/ui/skill-tag";
import { routing } from "@/i18n/routing";
import { getProject, getProjectSlugs, projectSlugsByKey } from "@/lib/content";
import { buildProjectCreativeWork } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/site-config";
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

  return buildPageMetadata(
    locale,
    {
      kind: "content",
      content: "project",
      slugs: projectSlugsByKey(project.translationKey),
    },
    {
      title: project.title,
      description: project.summary,
      type: "article",
      ...(project.updated ? { modifiedTime: project.updated } : {}),
      authors: [siteConfig.person.name],
      tags: project.stack,
      // Same reason as the blog card: the alt has to name the title the
      // image actually shows.
      imageAlt: tMeta("ogAltPage", { title: project.title }),
    }
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await resolveLocaleAndSlug(params);
  setRequestLocale(locale);

  const project = getProject(locale, slug);
  if (!project) notFound();

  const [t, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: "projects" }),
    getTranslations({ locale, namespace: "a11y" }),
  ]);
  const newTabHint = tA11y("opensInNewTab");

  const structuredData = buildProjectCreativeWork(locale, project);

  return (
    <PageSection as="article">
      <JsonLd data={structuredData} />
      <Breadcrumb
        locale={locale}
        items={[
          { name: t("title"), href: "/projects" },
          { name: project.title },
        ]}
      />

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
                <NewTabHint text={newTabHint} />
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
                <NewTabHint text={newTabHint} />
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
        kind="project"
        slug={slug}
        title={project.title}
      />

      <ContactCta scope="project" />
    </PageSection>
  );
}
