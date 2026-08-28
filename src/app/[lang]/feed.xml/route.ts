import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getPosts, type Locale } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";
import { escapeXml } from "@/lib/seo/xml";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";
// Layouts do not wrap route handlers, so the [lang] layout's dynamicParams
// does not reach this file: without its own flag /anything/feed.xml would
// serve the default locale feed with a 200 instead of a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const locale: Locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = getPosts(locale);
  const feedUrl = absoluteUrl(locale, "/feed.xml");
  const blogUrl = absoluteUrl(locale, "/blog");

  const items = posts
    .map((post) => {
      const url = absoluteUrl(locale, `/blog/${post.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  // Posts are already sorted newest first by getPosts, so the first entry
  // (if any) carries the most recent publish date.
  const lastBuildDate =
    posts.length > 0
      ? `\n    <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>`
      : "";

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(siteConfig.person.name)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(t("description"))}</description>`,
    `    <language>${locale}</language>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${lastBuildDate}`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
