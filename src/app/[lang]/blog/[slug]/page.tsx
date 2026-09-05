import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ContactCta } from "@/components/sections/contact-cta";
import { MDXContent } from "@/components/content/mdx-content";
import { mdxComponents } from "@/components/content/mdx-components";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/seo/breadcrumb";
import { PageSection } from "@/components/layout/page-section";
import { ShareCard } from "@/components/sections/share-card";
import { routing } from "@/i18n/routing";
import {
  getPost,
  getPostSlugs,
  postSlugsByKey,
  readingMinutes,
} from "@/lib/content";
import { buildBlogPosting } from "@/lib/seo/jsonld";
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

  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata(
    locale,
    {
      kind: "content",
      content: "post",
      slugs: postSlugsByKey(post.translationKey),
    },
    {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [siteConfig.person.name],
      tags: post.tags,
      // That card leads with the post title, so the identity alt would be
      // describing an image nobody is served here.
      imageAlt: tMeta("ogAltPage", { title: post.title }),
    }
  );
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = await resolveLocaleAndSlug(params);
  setRequestLocale(locale);

  const post = getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const format = await getFormatter({ locale });

  const structuredData = buildBlogPosting(locale, post);

  return (
    <PageSection as="article">
      <JsonLd data={structuredData} />
      <Breadcrumb
        locale={locale}
        items={[{ name: t("title"), href: "/blog" }, { name: post.title }]}
      />

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

      <ShareCard locale={locale} kind="post" slug={slug} title={post.title} />

      <ContactCta />
    </PageSection>
  );
}
