import { beforeEach, describe, expect, it, vi } from "vitest";

describe("locale url helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.sh/");
  });

  it("keeps the default locale on the root and prefixes the other one", async () => {
    const { localePath } = await import("@/lib/seo/locale-url");
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("tr", "/")).toBe("/tr");
    expect(localePath("en", "/about")).toBe("/about");
    expect(localePath("tr", "/about")).toBe("/tr/about");
    expect(localePath("tr", "/projects/design-system")).toBe(
      "/tr/projects/design-system"
    );
  });

  it("builds absolute urls and strips a trailing slash from the site url", async () => {
    const { localeUrl } = await import("@/lib/seo/locale-url");
    expect(localeUrl("en", "/")).toBe("https://dogancanyildiz.sh/");
    expect(localeUrl("tr", "/about")).toBe(
      "https://dogancanyildiz.sh/tr/about"
    );
  });

  it("emits a self referencing alternate plus x-default for every locale", async () => {
    const { buildAlternates } = await import("@/lib/seo/locale-url");
    expect(buildAlternates("tr", "/about")).toEqual({
      canonical: "https://dogancanyildiz.sh/tr/about",
      languages: {
        en: "https://dogancanyildiz.sh/about",
        tr: "https://dogancanyildiz.sh/tr/about",
        "x-default": "https://dogancanyildiz.sh/about",
      },
    });
  });

  it("omits locales that have no translated content", async () => {
    const { buildAlternates } = await import("@/lib/seo/locale-url");
    expect(buildAlternates("tr", "/blog/only-turkish", ["tr"])).toEqual({
      canonical: "https://dogancanyildiz.sh/tr/blog/only-turkish",
      languages: {
        tr: "https://dogancanyildiz.sh/tr/blog/only-turkish",
      },
    });
  });

  it("throws when the site url is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { siteUrl } = await import("@/lib/env");
    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
