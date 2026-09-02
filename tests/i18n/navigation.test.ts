import { describe, expect, it } from "vitest";
import {
  contentHref,
  getPathname,
  ogImageHref,
  pathnameForLocale,
} from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { switchTargetPath } from "@/i18n/switch-target";

/** First parameter of a function type, for the compile time guards below. */
type LocaleParam<T> = T extends (locale: infer L, ...rest: never[]) => unknown
  ? L
  : never;

describe("locale aware navigation", () => {
  it("keeps Turkish on the root, prefixes English, and localizes nav slugs", () => {
    expect(getPathname({ locale: "tr", href: "/" })).toBe("/");
    expect(getPathname({ locale: "en", href: "/" })).toBe("/en");
    expect(getPathname({ locale: "tr", href: "/about" })).toBe("/hakkimda");
    expect(getPathname({ locale: "en", href: "/about" })).toBe("/en/about");
    expect(getPathname({ locale: "tr", href: "/contact" })).toBe("/iletisim");
    expect(getPathname({ locale: "en", href: "/contact" })).toBe("/en/contact");
    expect(
      getPathname({
        locale: "tr",
        href: {
          pathname: "/projects/[slug]",
          params: { slug: "design-system" },
        },
      })
    ).toBe("/projeler/design-system");
    expect(
      getPathname({
        locale: "en",
        href: {
          pathname: "/projects/[slug]",
          params: { slug: "design-system" },
        },
      })
    ).toBe("/en/projects/design-system");
  });

  it("localizes the section roots", () => {
    expect(getPathname({ locale: "tr", href: "/blog" })).toBe("/yazilar");
    expect(getPathname({ locale: "en", href: "/blog" })).toBe("/en/blog");
    expect(getPathname({ locale: "tr", href: "/projects" })).toBe("/projeler");
    expect(getPathname({ locale: "en", href: "/projects" })).toBe(
      "/en/projects"
    );
  });
});

describe("contentHref", () => {
  it("builds the localized detail path for each locale", () => {
    expect(contentHref("tr", "post", "capt-sinavina-hazirlik")).toBe(
      "/yazilar/capt-sinavina-hazirlik"
    );
    expect(contentHref("en", "post", "capt-preparation-in-a-docker-lab")).toBe(
      "/en/blog/capt-preparation-in-a-docker-lab"
    );
    expect(contentHref("tr", "project", "not-ortalamasi-hesaplayici")).toBe(
      "/projeler/not-ortalamasi-hesaplayici"
    );
    expect(contentHref("en", "project", "gpa-calculator")).toBe(
      "/en/projects/gpa-calculator"
    );
  });
});

describe("ogImageHref", () => {
  it("hangs the card off the localized detail path", () => {
    expect(ogImageHref("tr", "project", "hubit")).toBe(
      "/projeler/hubit/opengraph-image/default"
    );
    expect(ogImageHref("en", "project", "hubit")).toBe(
      "/en/projects/hubit/opengraph-image/default"
    );
    expect(ogImageHref("tr", "post", "ccna-dan-web-guvenligine")).toBe(
      "/yazilar/ccna-dan-web-guvenligine/opengraph-image/default"
    );
    expect(ogImageHref("en", "post", "from-ccna-to-web-security")).toBe(
      "/en/blog/from-ccna-to-web-security/opengraph-image/default"
    );
  });
});

describe("pathnameForLocale", () => {
  it("prefixes a fixed path the pathnames map does not list", () => {
    // The identity OG card is the same path in both locales, so it stays out
    // of the map and only picks up the as-needed prefix here.
    expect(pathnameForLocale("tr", "/opengraph-image/default")).toBe(
      "/opengraph-image/default"
    );
    expect(pathnameForLocale("en", "/opengraph-image/default")).toBe(
      "/en/opengraph-image/default"
    );
  });

  it("refuses a dynamic template, which has to go through contentHref", () => {
    // Contract guard. Handing a template string to next-intl's getPathname
    // reaches compileLocalizedPathname with no params, which throws rather
    // than leaking a literal "[slug]" into an href.
    expect(() => pathnameForLocale("tr", "/blog/[slug]")).toThrow(
      /Insufficient params/
    );
    expect(() => pathnameForLocale("en", "/projects/[slug]")).toThrow(
      /Insufficient params/
    );
  });

  it("keeps its locale parameter narrowed to the routed locales", () => {
    // Compile time half of the test. src/types/next-intl.d.ts narrows the
    // next-intl AppConfig Locale, so getPathname stopped accepting a bare
    // string and a `locale: string` parameter here broke `npm run typecheck`,
    // which is a CI gate (.github/workflows/ci.yml). Widening it back makes
    // the conditional resolve to false and this assignment stops compiling.
    const narrowed: LocaleParam<typeof pathnameForLocale> extends AppLocale
      ? true
      : false = true;
    expect(narrowed).toBe(true);
  });
});

describe("switchTargetPath", () => {
  it("falls back to the blog root for an untranslated post", () => {
    expect(
      switchTargetPath("/blog/self-hosting-with-coolify", [
        "/blog/self-hosting-with-coolify",
      ])
    ).toBe("/blog");
  });

  it("falls back to the projects root for an untranslated project", () => {
    expect(
      switchTargetPath("/projects/cargo-pilot", ["/projects/cargo-pilot"])
    ).toBe("/projects");
  });

  it("falls back to the root for any other untranslated path", () => {
    expect(switchTargetPath("/somewhere", ["/somewhere"])).toBe("/");
  });

  it("leaves a translated path unchanged", () => {
    expect(
      switchTargetPath("/about", ["/blog/self-hosting-with-coolify"])
    ).toBe("/about");
  });

  it("leaves the root unchanged even if it were listed as untranslated", () => {
    expect(switchTargetPath("/", [])).toBe("/");
  });
});
