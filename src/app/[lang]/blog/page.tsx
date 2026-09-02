import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { PostList } from "@/components/sections/post-list";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { routing } from "@/i18n/routing";
import { getPosts, toPostCardData } from "@/lib/content";
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
  const t = await getTranslations({ locale, namespace: "blog" });

  return buildPageMetadata(
    locale,
    { kind: "static", path: "/blog" },
    {
      title: t("title"),
      description: t("description"),
    }
  );
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = getPosts(locale).map(toPostCardData);

  return (
    <PageSection>
      <PageHeader as="h1" title={t("title")} description={t("description")} />
      {posts.length > 0 ? (
        <PostList posts={posts} />
      ) : (
        <p className="section-copy">{t("empty")}</p>
      )}
      <ContactCta />
    </PageSection>
  );
}
