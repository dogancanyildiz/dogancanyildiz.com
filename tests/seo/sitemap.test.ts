import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
});

describe("sitemap", () => {
  it("lists both locales for the static pages", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://dogancanyildiz.com/");
    expect(urls).toContain("https://dogancanyildiz.com/en");
    expect(urls).toContain("https://dogancanyildiz.com/hakkimda");
    expect(urls).toContain("https://dogancanyildiz.com/en/about");
    expect(urls).toContain("https://dogancanyildiz.com/projeler");
    expect(urls).toContain("https://dogancanyildiz.com/en/projects");
    expect(urls).toContain("https://dogancanyildiz.com/blog");
    expect(urls).toContain("https://dogancanyildiz.com/en/blog");
    expect(urls).toContain("https://dogancanyildiz.com/iletisim");
    expect(urls).toContain("https://dogancanyildiz.com/en/contact");
    expect(urls).toContain("https://dogancanyildiz.com/gizlilik");
    expect(urls).toContain("https://dogancanyildiz.com/en/privacy");
    expect(urls).not.toContain("https://dogancanyildiz.com/coming-soon");
    expect(urls).not.toContain("https://dogancanyildiz.com/en/coming-soon");
    expect(urls).not.toContain("https://dogancanyildiz.com/updating");
    expect(urls).not.toContain("https://dogancanyildiz.com/en/updating");
  });

  it("lists every project in both locales because all of them are translated", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const { getProjects } = await import("@/lib/content");
    const urls = sitemap().map((entry) => entry.url);

    for (const project of getProjects("en")) {
      expect(urls).toContain(
        `https://dogancanyildiz.com/projects/${project.slug}`
      );
      expect(urls).toContain(
        `https://dogancanyildiz.com/en/projects/${project.slug}`
      );
    }
  });

  it("lists every bilingual post at both locale urls", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);
    const enUrl = "https://dogancanyildiz.com/en/blog/capt-sinavina-hazirlik";
    const trUrl = "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik";

    expect(urls).toContain(enUrl);
    expect(urls).toContain(trUrl);
  });

  it("puts both languages on a bilingual post entry", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = sitemap();
    const entry = entries.find(
      (item) =>
        item.url === "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik"
    );

    expect(entry).toBeDefined();
    expect(entry?.alternates?.languages?.en).toBe(
      "https://dogancanyildiz.com/en/blog/capt-sinavina-hazirlik"
    );
    expect(entry?.alternates?.languages?.tr).toBe(
      "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik"
    );
    expect(entry?.alternates?.languages?.["x-default"]).toBe(
      "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik"
    );
  });

  it("lists the bilingual post at both locale urls with both languages in its alternates", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const enUrl =
      "https://dogancanyildiz.com/en/blog/self-hosting-with-coolify";
    const trUrl = "https://dogancanyildiz.com/blog/self-hosting-with-coolify";

    expect(urls).toContain(enUrl);
    expect(urls).toContain(trUrl);

    const enEntry = entries.find((item) => item.url === enUrl);
    const trEntry = entries.find((item) => item.url === trUrl);

    expect(enEntry?.alternates?.languages?.en).toBe(enUrl);
    expect(enEntry?.alternates?.languages?.tr).toBe(trUrl);
    expect(trEntry?.alternates?.languages?.en).toBe(enUrl);
    expect(trEntry?.alternates?.languages?.tr).toBe(trUrl);
  });

  it("sets lastModified on the post entry to the post date", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const { getPost } = await import("@/lib/content");
    const entries = sitemap();
    const entry = entries.find(
      (item) =>
        item.url === "https://dogancanyildiz.com/blog/capt-sinavina-hazirlik"
    );
    const post = getPost("tr", "capt-sinavina-hazirlik");

    expect(post).toBeDefined();
    expect(entry?.lastModified).toEqual(new Date(post!.date));
  });

  it("has a getPost/getProject entry for every content url the sitemap lists", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const { getPost, getProject } = await import("@/lib/content");
    const entries = sitemap();

    const pattern =
      /^https:\/\/dogancanyildiz\.com(\/en)?\/(blog|projects)\/([a-z0-9-]+)$/;

    let matchedAny = false;
    for (const entry of entries) {
      const match = entry.url.match(pattern);
      if (!match) continue;
      matchedAny = true;

      const [, enPrefix, section, slug] = match;
      if (!slug) throw new Error(`no slug captured from ${entry.url}`);
      const locale = enPrefix ? "en" : "tr";

      if (section === "blog") {
        expect(getPost(locale, slug), entry.url).toBeDefined();
      } else {
        expect(getProject(locale, slug), entry.url).toBeDefined();
      }
    }

    expect(matchedAny).toBe(true);
  });

  it("has no duplicate urls", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never falls back to a placeholder domain", async () => {
    const sitemap = (await import("@/app/sitemap")).default;

    expect(JSON.stringify(sitemap())).not.toContain("example.com");
  });
});

describe("sitemap serialisation", () => {
  it("carries a resolvable absolute url, changefreq and priority on every entry", async () => {
    const sitemap = (await import("@/app/sitemap")).default;

    for (const entry of sitemap()) {
      expect(() => new URL(entry.url)).not.toThrow();
      // Compare the parsed origin, not a string prefix: a prefix check would
      // also accept https://dogancanyildiz.com.evil.example.
      expect(new URL(entry.url).origin).toBe("https://dogancanyildiz.com");
      expect(entry.changeFrequency).toBeTruthy();
      expect(typeof entry.priority).toBe("number");
    }
  });

  it("gives every entry an x-default alternate", async () => {
    const sitemap = (await import("@/app/sitemap")).default;

    for (const entry of sitemap()) {
      const languages = entry.alternates?.languages;
      expect(languages, entry.url).toBeDefined();
      expect(languages?.["x-default"], entry.url).toBeTruthy();
    }
  });

  it("leaves lastmod off the static pages instead of stamping the build time", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = sitemap();
    const staticUrls = [
      "https://dogancanyildiz.com/",
      "https://dogancanyildiz.com/en",
      "https://dogancanyildiz.com/hakkimda",
      "https://dogancanyildiz.com/en/contact",
    ];

    // A build timestamp told a crawler the whole site changed on every deploy.
    for (const url of staticUrls) {
      const entry = entries.find((item) => item.url === url);
      expect(entry, url).toBeDefined();
      expect(entry?.lastModified, url).toBeUndefined();
    }
  });

  it("never dates a content entry in the future", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const now = Date.now();

    for (const entry of sitemap()) {
      if (!entry.lastModified) continue;
      expect(new Date(entry.lastModified).getTime()).toBeLessThanOrEqual(now);
    }
  });
});

// F-072: the guard that keeps an untranslated page out of the hreflang set has
// to hold for a slug that exists in one locale only. Every real content file
// happens to be bilingual today, so a test built on the real collections
// cannot observe the single locale branch at all.
describe("hreflang alternates for partly translated content", () => {
  it("does not advertise a locale the content was never translated into", async () => {
    const { buildLanguageAlternates } = await import("@/lib/seo/alternates");
    const languages = buildLanguageAlternates("/blog/only-in-turkish", ["tr"]);

    expect(languages).toEqual({
      tr: "https://dogancanyildiz.com/blog/only-in-turkish",
      "x-default": "https://dogancanyildiz.com/blog/only-in-turkish",
    });
    expect(languages.en).toBeUndefined();
  });

  it("prefers the default locale for x-default when both locales exist", async () => {
    const { buildLanguageAlternates } = await import("@/lib/seo/alternates");
    const languages = buildLanguageAlternates("/projects/both", ["en", "tr"]);

    expect(languages["x-default"]).toBe(languages.tr);
  });

  it("falls back to the only available locale for x-default", async () => {
    const { buildLanguageAlternates } = await import("@/lib/seo/alternates");
    const languages = buildLanguageAlternates("/projects/tr-only", ["tr"]);

    expect(languages["x-default"]).toBe(languages.tr);
  });

  it("is the same helper the page head uses, so the two can never disagree", async () => {
    const { buildAlternates, buildLanguageAlternates } =
      await import("@/lib/seo/alternates");

    expect(buildAlternates("tr", "/blog/x", ["tr"]).languages).toEqual(
      buildLanguageAlternates("/blog/x", ["tr"], "tr")
    );
  });
});

describe("robots", () => {
  it("points at the real sitemap and blocks the api surface", async () => {
    const robots = (await import("@/app/robots")).default;
    const result = robots();

    expect(result.sitemap).toBe("https://dogancanyildiz.com/sitemap.xml");
    expect(result.rules).toEqual([
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ]);
  });
});
