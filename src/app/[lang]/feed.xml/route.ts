import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getPosts, type Locale } from "@/lib/content";
import { absoluteUrl, feedTitle } from "@/lib/seo/alternates";
import { escapeXml } from "@/lib/seo/xml";

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

  // lastBuildDate is the channel's freshness signal, so it has to move when a
  // post is revised, not only when one is published. The sitemap and the
  // BlogPosting JSON-LD already read `updated ?? date`; reading only `date`
  // here made the three disagree about the same post. getPosts sorts by
  // publish date, so the newest revision is a max over the whole list.
  const newestChange = posts.reduce<number | null>((newest, post) => {
    const changed = new Date(post.updated ?? post.date).getTime();
    if (Number.isNaN(changed)) return newest;
    return newest === null || changed > newest ? changed : newest;
  }, null);
  const lastBuildDate =
    newestChange === null
      ? ""
      : `\n    <lastBuildDate>${new Date(newestChange).toUTCString()}</lastBuildDate>`;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    // Localized, because the two feeds are otherwise indistinguishable in a
    // reader: the unprefixed /feed.xml used to be the English one and is now
    // the Turkish one, and a subscriber sees this title, not the URL.
    `    <title>${escapeXml(feedTitle(t("title")))}</title>`,
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
