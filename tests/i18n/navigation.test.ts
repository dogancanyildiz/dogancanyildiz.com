import { describe, expect, it } from "vitest";
import { getPathname } from "@/i18n/navigation";

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
