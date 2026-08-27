import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.sh");
});

describe("sitemap", () => {
  it("lists both locales for the static pages", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://dogancanyildiz.sh/");
    expect(urls).toContain("https://dogancanyildiz.sh/tr");
    expect(urls).toContain("https://dogancanyildiz.sh/about");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/about");
    expect(urls).toContain("https://dogancanyildiz.sh/projects");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/projects");
    expect(urls).toContain("https://dogancanyildiz.sh/blog");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/blog");
    expect(urls).toContain("https://dogancanyildiz.sh/contact");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/contact");
  });

  it("lists every project in both locales because all of them are translated", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const { getProjects } = await import("@/lib/content");
    const urls = sitemap().map((entry) => entry.url);

    for (const project of getProjects("en")) {
      expect(urls).toContain(
        `https://dogancanyildiz.sh/projects/${project.slug}`
      );
      expect(urls).toContain(
        `https://dogancanyildiz.sh/tr/projects/${project.slug}`
      );
    }
  });

  it("never lists a post url for a locale that has no translation", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);
    const enUrl = "https://dogancanyildiz.sh/blog/capt-sinavina-hazirlik";
    const trUrl = "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik";

    expect(urls).not.toContain(enUrl);
    expect(urls).toContain(trUrl);
  });

  it("does not put an alternate language on an untranslated entry", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = sitemap();
    const entry = entries.find(
      (item) =>
        item.url === "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik"
    );

    expect(entry).toBeDefined();
    expect(entry?.alternates?.languages?.en).toBeUndefined();
    expect(entry?.alternates?.languages?.tr).toBe(
      "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik"
    );
  });

  it("lists the bilingual post at both locale urls with both languages in its alternates", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const enUrl = "https://dogancanyildiz.sh/blog/self-hosting-with-coolify";
    const trUrl = "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify";

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
        item.url === "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik"
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
      /^https:\/\/dogancanyildiz\.sh(\/tr)?\/(blog|projects)\/([a-z0-9-]+)$/;

    let matchedAny = false;
    for (const entry of entries) {
      const match = entry.url.match(pattern);
      if (!match) continue;
      matchedAny = true;

      const [, trPrefix, section, slug] = match;
      const locale = trPrefix ? "tr" : "en";

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

describe("robots", () => {
  it("points at the real sitemap and blocks the api surface", async () => {
    const robots = (await import("@/app/robots")).default;
    const result = robots();

    expect(result.sitemap).toBe("https://dogancanyildiz.sh/sitemap.xml");
    expect(result.rules).toEqual([
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ]);
  });
});
