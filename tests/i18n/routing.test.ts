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

  it("localizes the section roots and the detail templates too", () => {
    expect(routing.pathnames["/blog"]).toEqual({
      tr: "/yazilar",
      en: "/blog",
    });
    expect(routing.pathnames["/blog/[slug]"]).toEqual({
      tr: "/yazilar/[slug]",
      en: "/blog/[slug]",
    });
    expect(routing.pathnames["/projects/[slug]"]).toEqual({
      tr: "/projeler/[slug]",
      en: "/projects/[slug]",
    });
  });

  it("maps the per page opengraph routes as well", () => {
    // next-intl only rewrites what the map lists. Without these two the
    // Turkish card URL (/yazilar/x/opengraph-image/default) falls into the
    // generic branch, gets rewritten to /tr/yazilar/... and 404s.
    expect(routing.pathnames["/blog/[slug]/opengraph-image/[id]"]).toEqual({
      tr: "/yazilar/[slug]/opengraph-image/[id]",
      en: "/blog/[slug]/opengraph-image/[id]",
    });
    expect(routing.pathnames["/projects/[slug]/opengraph-image/[id]"]).toEqual({
      tr: "/projeler/[slug]/opengraph-image/[id]",
      en: "/projects/[slug]/opengraph-image/[id]",
    });
  });

  it("stops next-intl from emitting its own hreflang Link header", () => {
    // Source of truth for hreflang is the HTML <head> built by
    // buildAlternates. next-intl's Link header puts the current param value
    // into the other locale's template, so a Turkish slug would be announced
    // under the English template as a 404 alternate. See docs/04-i18n.md.
    expect(routing.alternateLinks).toBe(false);
  });
});
