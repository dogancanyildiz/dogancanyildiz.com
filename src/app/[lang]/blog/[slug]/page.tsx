import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { MDXContent } from "@/components/content/mdx-content";
import { mdxComponents } from "@/components/content/mdx-components";
import { JsonLd } from "@/components/seo/json-ld";
import { PageSection } from "@/components/layout/page-section";
import { ShareCard } from "@/components/sections/share-card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getPost,
  getPostLocales,
  getPostSlugs,
  readingMinutes,
} from "@/lib/content";
import { buildBlogPosting, buildBreadcrumbList } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/site-config";
import { ogImagePathFor } from "@/lib/seo/og-image";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocaleAndSlug } from "@/lib/route-params";

interface PostPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getPostSlugs(lang).map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { locale, slug } = await resolveLocaleAndSlug(params);

  const post = getPost(locale, slug);
  if (!post) notFound();

  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata(locale, `/blog/${slug}`, {
    title: post.title,
    description: post.summary,
    availableLocales: getPostLocales(slug),
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    authors: [siteConfig.person.name],
    tags: post.tags,
    // This page has an opengraph-image.tsx of its own; without naming it the
    // openGraph object here would keep pointing at the identity card.
    imagePath: ogImagePathFor(`/blog/${slug}`),
    // That card leads with the post title, so the identity alt would be
    // describing an image nobody is served here.
    imageAlt: tMeta("ogAltPage", { title: post.title }),
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = await resolveLocaleAndSlug(params);
  setRequestLocale(locale);

  const post = getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const format = await getFormatter({ locale });

  const structuredData = buildBlogPosting(locale, post);

  const breadcrumb = buildBreadcrumbList(locale, [
    { name: t("title"), path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ]);

  return (
    <PageSection as="article">
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumb} />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <header className="space-y-4 border-b border-border pb-6">
        <p className="meta-label">
          <time dateTime={post.date}>
            {format.dateTime(new Date(post.date), {
              dateStyle: "long",
              timeZone: "UTC",
            })}
          </time>
          <span aria-hidden="true"> · </span>
          {t("readingTime", { minutes: readingMinutes(post) })}
        </p>
        <h1 className="page-title">{post.title}</h1>
        <p className="section-copy">{post.summary}</p>
        {post.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <span className="tag-pill normal-case tracking-normal">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="prose-content">
        <MDXContent code={post.code} components={mdxComponents} />
      </div>

      <ShareCard locale={locale} path={`/blog/${slug}`} title={post.title} />

      <ContactCta />
    </PageSection>
  );
}
