import { describe, expect, it } from "vitest";
import { getPathname, pathnameForLocale } from "@/i18n/navigation";
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
    ).toBe("/projects/design-system");
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
});

describe("pathnameForLocale", () => {
  it("prefixes a runtime slug the pathnames map does not list", () => {
    expect(pathnameForLocale("tr", "/blog/trace-logs")).toBe(
      "/blog/trace-logs"
    );
    expect(pathnameForLocale("en", "/blog/trace-logs")).toBe(
      "/en/blog/trace-logs"
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
