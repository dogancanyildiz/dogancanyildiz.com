import { describe, expect, it } from "vitest";
import { getPathname } from "@/i18n/navigation";
import { switchTargetPath } from "@/i18n/switch-target";

describe("locale aware navigation", () => {
  it("keeps the default locale on the root and prefixes the other one", () => {
    expect(getPathname({ locale: "en", href: "/" })).toBe("/");
    expect(getPathname({ locale: "tr", href: "/" })).toBe("/tr");
    expect(getPathname({ locale: "en", href: "/about" })).toBe("/about");
    expect(getPathname({ locale: "tr", href: "/about" })).toBe("/tr/about");
    expect(getPathname({ locale: "tr", href: "/projects/design-system" })).toBe(
      "/tr/projects/design-system"
    );
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
