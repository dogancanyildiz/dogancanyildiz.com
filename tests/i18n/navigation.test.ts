import { describe, expect, it } from "vitest";
import { getPathname } from "@/i18n/navigation";
import { switchTargetPath } from "@/i18n/switch-target";

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
