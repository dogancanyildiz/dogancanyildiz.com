import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph } from "@/lib/seo/alternates";
import { Hero } from "@/components/sections/hero";
import { PostList } from "@/components/sections/post-list";
import { ProjectList } from "@/components/sections/project-list";
import { SkillsStrip } from "@/components/sections/skills-strip";
import { PersonJsonLd } from "@/components/seo/person-jsonld";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { skills } from "@/content/profile";
import { hasCv } from "@/lib/cv";
import { featuredSkillGroups } from "@/lib/skills";
import { profileImagePath } from "@/lib/profile-image";
import {
  getFeaturedProjects,
  getPosts,
  toPostCardData,
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

  const locale = lang as Locale;
  const tHome = await getTranslations({ locale, namespace: "home" });
  const featured = getFeaturedProjects(locale).map(toProjectCardData);
  const latestPosts = getPosts(locale).slice(0, 3).map(toPostCardData);

  return (
    <>
      <PersonJsonLd locale={lang} />
      <Hero showCv={hasCv()} profileImageSrc={profileImagePath()} />
      <PageSection innerClassName="space-y-12">
        <div className="space-y-8">
          <PageHeader
            as="h2"
            title={tHome("featuredTitle")}
            action={
              <Link
                href="/projects"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {tHome("featuredLink")}
              </Link>
            }
          />
          <ProjectList projects={featured} headingLevel="h3" />
        </div>
        {latestPosts.length > 0 ? (
          <div className="space-y-8">
            <PageHeader
              as="h2"
              title={tHome("latestPostsTitle")}
              action={
                <Link
                  href="/blog"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {tHome("latestPostsLink")}
                </Link>
              }
            />
            <PostList posts={latestPosts} headingLevel="h3" />
          </div>
        ) : null}
        <SkillsStrip groups={featuredSkillGroups(skills[locale])} />
      </PageSection>
    </>
  );
}
