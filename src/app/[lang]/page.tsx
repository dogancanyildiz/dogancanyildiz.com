import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";
import { Hero } from "@/components/sections/hero";
import { PostList } from "@/components/sections/post-list";
import { ProjectList } from "@/components/sections/project-list";
import { SkillsStrip } from "@/components/sections/skills-strip";
import { ExperienceSummary } from "@/components/sections/experience-summary";
import { Systems } from "@/components/sections/systems";
import { ContactCta } from "@/components/sections/contact-cta";
import { PersonJsonLd } from "@/components/seo/person-jsonld";
import { WebSiteJsonLd } from "@/components/seo/website-jsonld";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { skills } from "@/content/profile";
import { hasCv } from "@/lib/cv";
import { featuredSkillGroups } from "@/lib/skills";
import { profileImagePath } from "@/lib/profile-image";
import {
  getHomeProjects,
  getPosts,
  toPostCardData,
  toProjectCardData,
} from "@/lib/content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });

  // absoluteTitle because defaultTitle already carries the name and the role;
  // it must not pick up the layout's "%s | name" template on top of that.
  return buildPageMetadata(locale, "/", {
    title: t("defaultTitle"),
    description: t("defaultDescription"),
    availableLocales: [...routing.locales],
    absoluteTitle: true,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const tHome = await getTranslations({ locale, namespace: "home" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  const tProjects = await getTranslations({ locale, namespace: "projects" });
  const projects = getHomeProjects(locale).map(toProjectCardData);
  const latestPosts = getPosts(locale).slice(0, 3).map(toPostCardData);

  return (
    <>
      <PersonJsonLd locale={locale} />
      <WebSiteJsonLd
        locale={locale}
        name={tMeta("siteName")}
        description={tMeta("defaultDescription")}
      />
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
          {projects.length > 0 ? (
            <ProjectList projects={projects} headingLevel="h3" />
          ) : (
            <p className="section-copy">{tProjects("empty")}</p>
          )}
        </div>

        <ExperienceSummary locale={locale} />

        <Systems />

        <SkillsStrip groups={featuredSkillGroups(skills[locale])} />

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

        <ContactCta />
      </PageSection>
    </>
  );
}
