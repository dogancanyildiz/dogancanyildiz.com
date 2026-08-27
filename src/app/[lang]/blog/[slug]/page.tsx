import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hasLocale } from "next-intl";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { MDXContent } from "@/components/content/mdx-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getPost,
  getPostLocales,
  getPostSlugs,
  type Locale,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";
import { siteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

interface PostPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getPostSlugs(lang as Locale).map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const post = getPost(lang as Locale, slug);
  if (!post) notFound();

  return buildPageMetadata(lang, `/blog/${slug}`, {
    title: post.title,
    description: post.summary,
    availableLocales: getPostLocales(slug),
    type: "article",
    publishedTime: post.date,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const post = getPost(lang as Locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale: lang, namespace: "blog" });
  const format = await getFormatter({ locale: lang });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: lang,
    keywords: post.tags.join(", "),
    wordCount: post.metadata.wordCount,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(lang as Locale, `/blog/${slug}`),
    },
    author: {
      "@type": "Person",
      name: siteConfig.person.name,
      url: absoluteUrl("en", "/"),
    },
  };

  return (
    <article className="section-space">
      <JsonLd data={structuredData} />
      <div className="page-shell-reading space-y-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>

        <header className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
          <h1 className="text-4xl leading-tight sm:text-5xl">{post.title}</h1>
          <p className="section-copy">{post.summary}</p>
          {post.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 font-mono text-xs tracking-[0.08em] text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="prose-content">
          <MDXContent code={post.code} />
        </div>
      </div>
    </article>
  );
}
