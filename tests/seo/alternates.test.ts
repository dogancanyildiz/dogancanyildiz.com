import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  absoluteUrl,
  buildAlternates,
  buildOpenGraph,
  localePath,
  siteUrl,
} from "@/lib/seo/alternates";
import type { Locale } from "@/lib/content";

/** First parameter of a function type, for the compile time guard below. */
type LocaleParam<T> = T extends (locale: infer L, ...rest: never[]) => unknown
  ? L
  : never;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
});

describe("localePath", () => {
  it("keeps turkish at the root and localizes nav slugs", () => {
    expect(localePath("tr", "/")).toBe("/");
    expect(localePath("tr", "/about")).toBe("/hakkimda");
    expect(localePath("tr", "/contact")).toBe("/iletisim");
    expect(localePath("tr", "/projects/cargo-pilot")).toBe(
      "/projects/cargo-pilot"
    );
  });

  it("prefixes english with /en", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/about")).toBe("/en/about");
    expect(localePath("en", "/projects/cargo-pilot")).toBe(
      "/en/projects/cargo-pilot"
    );
  });

  it("does not prefix a path that already carries a locale segment", () => {
    // A caller that hands over an already public path (a switcher target, a
    // pathname read off the current request) used to get /en/en/about, and
    // /tr was left as is even though the Turkish canonical is unprefixed.
    expect(localePath("en", "/en")).toBe("/en");
    expect(localePath("en", "/en/about")).toBe("/en/about");
    expect(localePath("tr", "/tr")).toBe("/");
    expect(localePath("tr", "/tr/about")).toBe("/hakkimda");
  });

  it("re-points a path carrying the other locale at the asked for locale", () => {
    expect(localePath("tr", "/en/about")).toBe("/hakkimda");
    expect(localePath("en", "/tr/about")).toBe("/en/about");
  });

  it("keeps its locale parameter narrowed to the routed locales", () => {
    // localePath hands its locale straight to pathnameForLocale, so it is the
    // second string gate on the same chain: narrowing only pathnameForLocale
    // moves the tsc error here instead of clearing it.
    const narrowed: LocaleParam<typeof localePath> extends Locale
      ? true
      : false = true;
    expect(narrowed).toBe(true);
  });

  it("leaves a slug that only starts with locale letters alone", () => {
    expect(localePath("en", "/projects/entrypoint")).toBe(
      "/en/projects/entrypoint"
    );
    expect(localePath("tr", "/blog/trace-logs")).toBe("/blog/trace-logs");
  });
});

describe("absoluteUrl", () => {
  it("joins the site url with the locale path", () => {
    expect(siteUrl()).toBe("https://dogancanyildiz.com");
    expect(absoluteUrl("tr", "/blog")).toBe("https://dogancanyildiz.com/blog");
    expect(absoluteUrl("en", "/")).toBe("https://dogancanyildiz.com/en");
  });
});

describe("buildAlternates", () => {
  it("lists both languages and x-default when both translations exist", () => {
    const result = buildAlternates("tr", "/blog/self-hosting-with-coolify", [
      "en",
      "tr",
    ]);
    expect(result.canonical).toBe(
      "https://dogancanyildiz.com/blog/self-hosting-with-coolify"
    );
    expect(result.languages).toEqual({
      en: "https://dogancanyildiz.com/en/blog/self-hosting-with-coolify",
      tr: "https://dogancanyildiz.com/blog/self-hosting-with-coolify",
      "x-default": "https://dogancanyildiz.com/blog/self-hosting-with-coolify",
    });
    expect(result.types["application/rss+xml"][0]?.url).toBe(
      "https://dogancanyildiz.com/feed.xml"
    );
  });

  it("omits the missing translation and falls back to the only locale for x-default", () => {
    const result = buildAlternates("tr", "/blog/capt-sinavina-hazirlik", [
      "tr",
    ]);
    expect(result.canonical).toBe(
      "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik"
    );
    expect(result.languages).toEqual({
      tr: "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik",
      "x-default": "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik",
    });
    expect(result.languages.en).toBeUndefined();
    expect(result.types["application/rss+xml"][0]?.url).toBe(
      "https://dogancanyildiz.com/feed.xml"
    );
  });
});

describe("buildOpenGraph", () => {
  it("builds a complete openGraph object per page", () => {
    expect(
      buildOpenGraph("tr", "/projects/design-system", {
        title: "Tasarim sistemi",
        description: "Aciklama",
        siteName: "Portfolyo",
        imageAlt: "Kart gorseli",
      })
    ).toEqual({
      type: "website",
      siteName: "Portfolyo",
      title: "Tasarim sistemi",
      description: "Aciklama",
      url: "https://dogancanyildiz.com/projects/design-system",
      locale: "tr_TR",
      alternateLocale: ["en_US"],
      images: [
        {
          url: "https://dogancanyildiz.com/opengraph-image/default",
          type: "image/png",
          width: 1200,
          height: 630,
          alt: "Kart gorseli",
        },
      ],
    });
  });

  it("sets type and publishedTime for an article", () => {
    const result = buildOpenGraph("en", "/blog/self-hosting-with-coolify", {
      title: "Self hosting with Coolify",
      description: "Aciklama",
      siteName: "Portfolyo",
      imageAlt: "Kart gorseli",
      type: "article",
      publishedTime: "2026-08-20",
    });

    const typed = result as { type: string; publishedTime: string };
    expect(typed.type).toBe("article");
    expect(typed.publishedTime).toBe("2026-08-20");
  });
});
