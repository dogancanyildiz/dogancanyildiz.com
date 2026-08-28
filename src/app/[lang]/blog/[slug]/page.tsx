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
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPost, getPostLocales, getPostSlugs } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";
import { OG_IMAGE_PATH } from "@/lib/seo/og-image";
import { buildBreadcrumbList, personRef } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/site-config";
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

  return buildPageMetadata(locale, `/blog/${slug}`, {
    title: post.title,
    description: post.summary,
    availableLocales: getPostLocales(slug),
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    authors: [siteConfig.person.name],
    tags: post.tags,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = await resolveLocaleAndSlug(params);
  setRequestLocale(locale);

  const post = getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const format = await getFormatter({ locale });

  // author and publisher are the same human, referenced through the shared
  // Person node instead of two inline copies. See src/lib/seo/jsonld.ts.
  const author = personRef();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    // Falls back to the publish date so an untouched post never claims a
    // revision it did not have.
    dateModified: post.updated ?? post.date,
    inLanguage: locale,
    keywords: post.tags.join(", "),
    wordCount: post.metadata.wordCount,
    image: absoluteUrl(locale, OG_IMAGE_PATH),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(locale, `/blog/${slug}`),
    },
    author,
    publisher: author,
  };

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
          {t("readingTime", {
            minutes: Math.max(1, Math.round(post.metadata.readingTime)),
          })}
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

      <ContactCta />
    </PageSection>
  );
}
