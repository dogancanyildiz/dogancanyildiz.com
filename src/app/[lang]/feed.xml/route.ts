import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ogImageHref } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPosts, type Locale } from "@/lib/content";
import {
  absoluteUrl,
  contentUrl,
  feedTitle,
  siteUrl,
} from "@/lib/seo/alternates";
import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from "@/lib/seo/og-image";
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
      const url = contentUrl(locale, "post", post.slug);
      // Each post draws its own card (src/app/[lang]/blog/[slug]/opengraph-image.tsx),
      // so a reader that renders images has one per entry instead of falling
      // back to the site identity card, or to nothing.
      //
      // Media RSS rather than <enclosure>: enclosure's `length` attribute is
      // the byte size of the file, and the card is rendered on request by a
      // metadata image route, so the feed would have to fetch every PNG at
      // build time only to fill in a number no reader needs. media:content
      // leaves length optional and carries the dimensions instead.
      const cardUrl = `${siteUrl()}${ogImageHref(locale, "post", post.slug)}`;
      // isPermaLink="false" plus a translationKey based tag URI (RFC 4151),
      // not the post's own url: this release renames both the Turkish
      // section path and, for two posts, the slug itself, so every guid
      // already changes once here regardless of which identifier is chosen.
      // A key based tag URI is the one choice that does not have to change
      // again the next time a slug or a section path does.
      //
      // The "2026" is a fixed part of the contract, not a date field:
      // changing it would redeliver the entire archive to every subscriber a
      // second time. Never bump it. tests/seo/feed.test.ts pins the literal
      // string.
      const guid = `tag:dogancanyildiz.com,2026:post/${locale}/${post.translationKey}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(guid)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        `      <media:content url="${escapeXml(cardUrl)}" type="${OG_IMAGE_CONTENT_TYPE}" medium="image" width="${OG_IMAGE_SIZE.width}" height="${OG_IMAGE_SIZE.height}" />`,
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
    // media: is declared on the root element, not per item, because an
    // undeclared prefix makes the whole document ill formed rather than one
    // element unreadable. No channel level <image> next to it: RSS 2.0 caps
    // that element at 144x400 px, which the 1200x630 card cannot meet.
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
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
