import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostList } from "@/components/sections/post-list";
import { routing } from "@/i18n/routing";
import { getPosts, toPostCardData, type Locale } from "@/lib/content";
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

  const t = await getTranslations({ locale: lang, namespace: "blog" });

  return buildPageMetadata(lang, "/blog", {
    title: t("title"),
    description: t("description"),
    availableLocales: [...routing.locales],
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: "blog" });
  const posts = getPosts(lang as Locale).map(toPostCardData);

  return (
    <section className="section-space">
      <div className="page-shell-reading space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="section-copy">{t("description")}</p>
        </header>
        {posts.length > 0 ? (
          <PostList posts={posts} />
        ) : (
          <p className="section-copy">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
