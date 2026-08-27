import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildAlternates,
  buildOpenGraph,
  localePath,
  siteUrl,
} from "@/lib/seo/alternates";

describe("localePath", () => {
  it("keeps english at the root", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/projects/cargo-pilot")).toBe(
      "/projects/cargo-pilot"
    );
  });

  it("prefixes turkish with /tr", () => {
    expect(localePath("tr", "/")).toBe("/tr");
    expect(localePath("tr", "/projects/cargo-pilot")).toBe(
      "/tr/projects/cargo-pilot"
    );
  });
});

describe("absoluteUrl", () => {
  it("joins the site url with the locale path", () => {
    expect(siteUrl()).toBe("https://dogancanyildiz.sh");
    expect(absoluteUrl("tr", "/blog")).toBe(
      "https://dogancanyildiz.sh/tr/blog"
    );
    expect(absoluteUrl("en", "/")).toBe("https://dogancanyildiz.sh/");
  });
});

describe("buildAlternates", () => {
  it("lists both languages and x-default when both translations exist", () => {
    const result = buildAlternates("tr", "/blog/self-hosting-with-coolify", [
      "en",
      "tr",
    ]);
    expect(result.canonical).toBe(
      "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify"
    );
    expect(result.languages).toEqual({
      en: "https://dogancanyildiz.sh/blog/self-hosting-with-coolify",
      tr: "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify",
      "x-default": "https://dogancanyildiz.sh/blog/self-hosting-with-coolify",
    });
    expect(result.types["application/rss+xml"][0].url).toBe(
      "https://dogancanyildiz.sh/tr/feed.xml"
    );
  });

  it("omits the missing translation and falls back to the only locale for x-default", () => {
    const result = buildAlternates("tr", "/blog/capt-sinavina-hazirlik", [
      "tr",
    ]);
    expect(result.canonical).toBe(
      "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik"
    );
    expect(result.languages).toEqual({
      tr: "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik",
      "x-default": "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik",
    });
    expect(result.languages.en).toBeUndefined();
    expect(result.types["application/rss+xml"][0].url).toBe(
      "https://dogancanyildiz.sh/tr/feed.xml"
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
      url: "https://dogancanyildiz.sh/tr/projects/design-system",
      locale: "tr_TR",
      alternateLocale: ["en_US"],
      images: [
        {
          url: "https://dogancanyildiz.sh/tr/opengraph-image/default",
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
