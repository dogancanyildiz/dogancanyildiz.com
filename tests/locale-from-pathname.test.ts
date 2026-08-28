import { describe, expect, it } from "vitest";
import { localeFromPathname } from "@/lib/locale-from-pathname";

describe("localeFromPathname", () => {
  it("maps /tr paths to tr", () => {
    expect(localeFromPathname("/tr")).toBe("tr");
    expect(localeFromPathname("/tr/about")).toBe("tr");
    expect(localeFromPathname("/tr/blog/nope")).toBe("tr");
  });

  it("maps everything else to en", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/about")).toBe("en");
    expect(localeFromPathname("/blog/nope")).toBe("en");
    expect(localeFromPathname("")).toBe("en");
  });
});
