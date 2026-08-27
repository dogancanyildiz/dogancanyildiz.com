import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.sh");
});

describe("sitemap", () => {
  it("lists every static page in both locales", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://dogancanyildiz.sh/");
    expect(urls).toContain("https://dogancanyildiz.sh/about");
    expect(urls).toContain("https://dogancanyildiz.sh/projects");
    expect(urls).toContain("https://dogancanyildiz.sh/contact");
    expect(urls).toContain("https://dogancanyildiz.sh/tr");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/about");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/projects");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/contact");
  });

  it("adds one detail entry per project per locale", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const { projects } = await import("@/data/projects");
    const urls = sitemap().map((entry) => entry.url);

    const en = urls.filter((url) => /^https:\/\/dogancanyildiz\.sh\/projects\/[^/]+$/.test(url));
    const tr = urls.filter((url) => /^https:\/\/dogancanyildiz\.sh\/tr\/projects\/[^/]+$/.test(url));

    expect(en).toHaveLength(projects.length);
    expect(tr).toHaveLength(projects.length);
  });

  it("attaches language alternates to every entry", async () => {
    const sitemap = (await import("@/app/sitemap")).default;

    for (const entry of sitemap()) {
      expect(entry.alternates?.languages).toBeDefined();
      expect(Object.keys(entry.alternates!.languages!)).toEqual(["en", "tr"]);
    }
  });

  it("produces no duplicate urls", async () => {
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
