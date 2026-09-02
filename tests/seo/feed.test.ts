import { beforeEach, describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import { getPosts } from "@/lib/content";
import { escapeXml } from "@/lib/seo/xml";

// next-intl/server resolves to its client build outside a Next request, so
// getTranslations throws when called. The stub reads the real catalogs, which
// keeps a missing key a failure rather than an empty string.
vi.mock("next-intl/server", () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: string;
    namespace?: string;
  }) => {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return (key: string) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const value = path
        .split(".")
        .reduce<unknown>(
          (node, segment) => (node as Record<string, unknown>)?.[segment],
          messages
        );
      if (typeof value !== "string") {
        throw new Error(`missing message key: ${locale}.${path}`);
      }
      return value;
    };
  },
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
});

async function feedFor(lang: string): Promise<{
  status: number;
  contentType: string | null;
  body: string;
}> {
  const { GET } = await import("@/app/[lang]/feed.xml/route");
  const response = await GET(new Request("https://dogancanyildiz.com"), {
    params: Promise.resolve({ lang }),
  });
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    body: await response.text(),
  };
}

/**
 * Minimal well-formedness check plus a tag reader.
 *
 * The node runtime has no DOMParser, and pulling an XML parser in for one
 * route would be more dependency than the feed is worth. Walking the tags
 * still catches the failures that matter: an unbalanced element, a raw & or <
 * that escaped the escaper, and a wrong item count.
 */
function tagsOf(xml: string): string[] {
  return [...xml.matchAll(/<(\/?)([a-zA-Z:]+)[^>]*?(\/?)>/g)]
    .filter((match) => match[1] === "" && match[3] === "")
    .flatMap((match) => match[2] ?? []);
}

function textInside(xml: string, tag: string): string[] {
  return [
    ...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g")),
  ].flatMap((match) => match[1] ?? []);
}

describe("rss feed route", () => {
  it.each([...routing.locales])(
    "serves %s as rss xml with one item per published post",
    async (locale) => {
      const { status, contentType, body } = await feedFor(locale);

      expect(status).toBe(200);
      expect(contentType).toContain("application/rss+xml");
      expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
        true
      );

      const tags = tagsOf(body);
      expect(tags[0]).toBe("rss");
      expect(tags).toContain("channel");

      const itemCount = tags.filter((tag) => tag === "item").length;
      expect(itemCount).toBe(getPosts(locale).length);
      expect(itemCount).toBeGreaterThan(0);

      // Every opening tag has to have a matching closing tag.
      for (const tag of new Set(tags)) {
        const opens = tags.filter((candidate) => candidate === tag).length;
        const closes = [...body.matchAll(new RegExp(`</${tag}>`, "g"))].length;
        expect(closes, `unbalanced <${tag}>`).toBe(opens);
      }
    }
  );

  it.each([...routing.locales])(
    "leaves no unescaped markup in the %s item text",
    async (locale) => {
      const { body } = await feedFor(locale);

      for (const text of [
        ...textInside(body, "title"),
        ...textInside(body, "description"),
      ]) {
        expect(text, text).not.toMatch(/[<>]/);
        expect(text, text).not.toMatch(/&(?!(amp|lt|gt|quot|apos);)/);
      }
    }
  );

  it("points every link and guid at the url of its own locale", async () => {
    const { body } = await feedFor("tr");
    const links = textInside(body, "link");

    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      expect(link.startsWith("https://dogancanyildiz.com/")).toBe(true);
      expect(link.startsWith("https://dogancanyildiz.com/en/")).toBe(false);
    }
    expect(textInside(body, "language")).toEqual(["tr"]);
  });

  it("names the language of the feed in its channel title", async () => {
    // The unprefixed /feed.xml used to be the English feed and is now the
    // Turkish one, and a reader shows the channel title, not the URL. Two
    // feeds called "Doğan Can YILDIZ" give a subscriber nothing to tell them
    // apart, so the title carries the localized section name as well.
    const en = await feedFor("en");
    const tr = await feedFor("tr");

    const [enTitle] = textInside(en.body, "title");
    const [trTitle] = textInside(tr.body, "title");

    expect(enTitle).toContain("Doğan Can YILDIZ");
    expect(trTitle).toContain("Doğan Can YILDIZ");
    expect(enTitle).toContain("Writing");
    expect(trTitle).toContain("Yazılar");
    expect(enTitle).not.toBe(trTitle);
  });

  it("lists the posts newest first", async () => {
    const { body } = await feedFor("en");
    const dates = textInside(body, "pubDate").map((value) =>
      new Date(value).getTime()
    );

    expect(dates.length).toBeGreaterThan(1);
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("falls back to the default locale for an unrouted lang", async () => {
    const { status, body } = await feedFor("nope");

    expect(status).toBe(200);
    expect(textInside(body, "language")).toEqual([routing.defaultLocale]);
  });
});

describe("lastBuildDate", () => {
  // The channel date used to read post.date only, so a revised post moved the
  // sitemap entry and the BlogPosting JSON-LD but left the feed claiming the
  // site had not changed since the newest post was first published.
  async function feedWithPosts(
    posts: { slug: string; date: string; updated?: string }[]
  ): Promise<string> {
    vi.resetModules();
    vi.doMock("@/lib/content", () => ({
      getPosts: () =>
        posts.map((post) => ({
          ...post,
          title: post.slug,
          summary: post.slug,
        })),
    }));
    const { GET } = await import("@/app/[lang]/feed.xml/route");
    const response = await GET(new Request("https://dogancanyildiz.com"), {
      params: Promise.resolve({ lang: "en" }),
    });
    const body = await response.text();
    vi.doUnmock("@/lib/content");
    vi.resetModules();
    return body;
  }

  it("reports the newest revision, not the newest publish date", async () => {
    const body = await feedWithPosts([
      { slug: "newest", date: "2026-03-01" },
      { slug: "older-but-revised", date: "2026-01-01", updated: "2026-06-15" },
    ]);

    expect(textInside(body, "lastBuildDate")).toEqual([
      new Date("2026-06-15").toUTCString(),
    ]);
  });

  it("keeps pubDate on the publish date of each item", async () => {
    const body = await feedWithPosts([
      { slug: "revised", date: "2026-01-01", updated: "2026-06-15" },
    ]);

    expect(textInside(body, "pubDate")).toEqual([
      new Date("2026-01-01").toUTCString(),
    ]);
  });

  it("omits the element when the feed carries no post", async () => {
    expect(await feedWithPosts([])).not.toContain("lastBuildDate");
  });
});

describe("escapeXml", () => {
  it("escapes the five xml entities", () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;"
    );
  });

  it("escapes the ampersand first so an entity is never double escaped", () => {
    // & last would turn "&lt;" from the < replacement into "&amp;lt;".
    expect(escapeXml("<")).toBe("&lt;");
    expect(escapeXml("&")).toBe("&amp;");
    expect(escapeXml("&amp;")).toBe("&amp;amp;");
  });

  it("leaves plain text, including non ascii, untouched", () => {
    expect(escapeXml("Doğan Can YILDIZ")).toBe("Doğan Can YILDIZ");
    expect(escapeXml("")).toBe("");
  });
});
