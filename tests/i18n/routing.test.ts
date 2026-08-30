import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing", () => {
  it("serves Turkish at the root and English under a prefix", () => {
    expect(routing.locales).toEqual(["en", "tr"]);
    expect(routing.defaultLocale).toBe("tr");
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("never redirects based on Accept-Language or cookies", () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.localeCookie).toBe(false);
  });

  it("localizes the nav slugs in Turkish and keeps English internal paths", () => {
    expect(routing.pathnames["/about"]).toEqual({
      tr: "/hakkimda",
      en: "/about",
    });
    expect(routing.pathnames["/projects"]).toEqual({
      tr: "/projeler",
      en: "/projects",
    });
    expect(routing.pathnames["/contact"]).toEqual({
      tr: "/iletisim",
      en: "/contact",
    });
    expect(routing.pathnames["/privacy"]).toEqual({
      tr: "/gizlilik",
      en: "/privacy",
    });
  });
});
