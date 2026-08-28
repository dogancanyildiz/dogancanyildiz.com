import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoPath = (relative: string) => join(process.cwd(), relative);
const read = (relative: string) => readFileSync(repoPath(relative), "utf8");
const exists = (relative: string) => {
  try {
    readFileSync(repoPath(relative));
    return true;
  } catch {
    return false;
  }
};

const messageKeys = (locale: string, namespace: string) => {
  const messages = JSON.parse(read(`messages/${locale}.json`)) as Record<
    string,
    unknown
  >;
  return Object.keys(messages[namespace] as Record<string, unknown>).sort();
};

describe("shared nav list", () => {
  it("exports the five top level routes as a const tuple", () => {
    expect(exists("src/lib/nav.ts")).toBe(true);
    const source = read("src/lib/nav.ts");
    expect(source).toContain("export const navItems");
    expect(source).toContain("export type NavItem");
    expect(source).toContain('{ href: "/", key: "nav.home" }');
    expect(source).toContain('{ href: "/about", key: "nav.about" }');
    expect(source).toContain('{ href: "/projects", key: "nav.projects" }');
    expect(source).toContain('{ href: "/blog", key: "nav.blog" }');
    expect(source).toContain('{ href: "/contact", key: "nav.contact" }');
    expect(source).toMatch(/\]\s*as const/);
  });
});

describe(".tap-target utility", () => {
  it("guarantees a 44px CSS px minimum hit area", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\.tap-target\s*\{[^}]*min-h-11[^}]*min-w-11/);
  });
});

describe("mobile menu", () => {
  it("is a Radix Dialog driven off the shared nav list", () => {
    expect(exists("src/components/layout/mobile-menu.tsx")).toBe(true);
    const source = read("src/components/layout/mobile-menu.tsx");
    expect(source).toContain("export function MobileMenu");
    expect(source).toContain('from "radix-ui"');
    expect(source).toContain('from "@/lib/nav"');
    expect(source).toContain("navItems.map");
    // Radix warns on the console if a Dialog.Content has no
    // Dialog.Description; the menu has no descriptive paragraph so the link
    // is explicitly dropped rather than left implicit.
    expect(source).toContain("aria-describedby={undefined}");
  });
});

describe("header", () => {
  const source = read("src/components/layout/header.tsx");

  it("drives the desktop nav off the shared list, not a local copy", () => {
    expect(source).toContain('from "@/lib/nav"');
    expect(source).not.toContain("navKeys");
  });

  it("renders the mobile menu trigger", () => {
    expect(source).toContain('from "./mobile-menu"');
    expect(source).toContain("<MobileMenu");
  });

  it("marks the active link with aria-current, not just styling", () => {
    expect(source).toContain("aria-current=");
  });

  it("shows the DCY monogram instead of a hard coded Portfolio eyebrow", () => {
    expect(source).not.toContain(">Portfolio<");
    expect(source).toContain('tBrand("monogram")');
  });

  it("uses the shared route list on every page", () => {
    expect(source).toContain("navItems.map");
    expect(source).not.toContain("homeAnchors");
  });
});

describe("footer", () => {
  const source = read("src/components/layout/footer.tsx");

  it("drives its page links off the shared nav list", () => {
    expect(source).toContain('from "@/lib/nav"');
    expect(source).toContain("navItems.map");
  });

  it("labels the page link block for assistive tech", () => {
    expect(source).toContain('aria-label={t("footer.navTitle")}');
  });

  it("exposes the public email in the footer", () => {
    expect(source).toContain("CONTACT_EMAIL_PUBLIC");
    expect(source).toContain("href={`mailto:${CONTACT_EMAIL_PUBLIC}`}");
  });

  it("has no leftover template contact details", () => {
    expect(source).not.toContain("alex@example.com");
    expect(source).not.toContain("Twitter");
    expect(source).not.toContain("twitter.com");
  });

  it("sources contact details and social links from lib/site, not hard coded strings", () => {
    expect(source).toContain('from "@/lib/site"');
    expect(source).toContain("CONTACT_EMAIL_PUBLIC");
    expect(source).toContain("SOCIAL");
    expect(source).not.toContain("github.com/");
  });

  it("is a server component: no client directive, no siteUrl in the bundle", () => {
    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("siteUrl");
    expect(source).not.toContain("/api/health");
    expect(source).toContain('from "next-intl/server"');
  });

  it("links feed.xml directly instead of through the next-intl Link helper", () => {
    expect(source).not.toContain('href="/feed.xml"');
    expect(source).toContain(
      'locale === routing.defaultLocale ? "/feed.xml" : `/${locale}/feed.xml`'
    );
  });
});

describe("mobile menu panel", () => {
  it("stays aligned under the h-16 header and keeps one full-width treatment at every mobile width", () => {
    const source = read("src/components/layout/mobile-menu.tsx");
    expect(source).toContain("top-16");
    expect(source).not.toContain("sm:inset-x-4");
    expect(source).not.toContain("sm:rounded-none");
  });

  it("keeps the overlay below the header instead of dimming it", () => {
    const source = read("src/components/layout/mobile-menu.tsx");
    expect(source).not.toMatch(/Dialog\.Overlay className="fixed inset-0\b/);
    expect(source).toMatch(/Dialog\.Overlay className="fixed inset-x-0 top-16/);
  });
});

describe("header height", () => {
  it("gives the header row enough height that its controls are not flush against the edges", () => {
    expect(read("src/components/layout/header.tsx")).toMatch(
      /className="page-shell flex h-16\b/
    );
  });
});

describe("skill category list", () => {
  it("groups skills in a div, not a section, so each group stops being its own landmark", () => {
    const source = read("src/components/sections/skill-group-grid.tsx");
    expect(source).not.toMatch(/<section\b/);
    expect(source).toContain("<div");
  });

  it("no longer ships the unused SkillGroupGrid deprecated alias", () => {
    expect(read("src/components/sections/skill-group-grid.tsx")).not.toContain(
      "SkillGroupGrid"
    );
  });
});

describe("page header titleId", () => {
  it("lets a caller point a landmark's aria-labelledby at the rendered heading", () => {
    const pageHeader = read("src/components/ui/page-header.tsx");
    expect(pageHeader).toContain("titleId?: string");
    expect(pageHeader).toContain("<Tag id={titleId}");
  });

  it("no longer ships the unused label/labelIndex/display props or the deprecated alias", () => {
    const pageHeader = read("src/components/ui/page-header.tsx");
    expect(pageHeader).not.toContain("labelIndex");
    expect(pageHeader).not.toContain("display?:");
    expect(pageHeader).not.toContain("SectionHeading");
    expect(exists("src/components/ui/section-label.tsx")).toBe(false);
  });

  it("wires the experience section's landmark name to the rendered heading, not the job title", () => {
    const summary = read("src/components/sections/experience-summary.tsx");
    expect(summary).toContain('titleId="home-experience-heading"');
    // The job title h3 used to carry this id itself; PageHeader's own
    // heading owns it now, so the h3 goes back to being a plain heading.
    expect(summary).not.toMatch(/<h3\s+id=/);
  });
});

describe("dead code removal", () => {
  it("drops hasProfileImage now that only profileImagePath is used", () => {
    expect(read("src/lib/profile-image.ts")).not.toContain("hasProfileImage");
  });
});

describe("new message keys", () => {
  it("adds nav.menu, nav.openMenu and nav.closeMenu to both catalogs", () => {
    for (const locale of ["en", "tr"]) {
      const keys = messageKeys(locale, "nav");
      expect(keys, locale).toContain("menu");
      expect(keys, locale).toContain("openMenu");
      expect(keys, locale).toContain("closeMenu");
    }
  });

  it("adds footer.navTitle to both catalogs", () => {
    for (const locale of ["en", "tr"]) {
      expect(messageKeys(locale, "footer"), locale).toContain("navTitle");
    }
  });

  it("turns brand into an object with name, monogram and role in both catalogs", () => {
    for (const locale of ["en", "tr"]) {
      const keys = messageKeys(locale, "brand");
      expect(keys, locale).toEqual(["monogram", "name", "role"]);
    }
  });

  it("adds the root level a11y labels to both catalogs", () => {
    for (const locale of ["en", "tr"]) {
      const messages = JSON.parse(read(`messages/${locale}.json`)) as Record<
        string,
        unknown
      >;
      expect(messages.a11y, locale).toEqual({
        skipToContent: expect.any(String),
        toggleTheme: expect.any(String),
      });
    }
  });

  it("keeps both catalogs on the same key set", () => {
    const en = JSON.parse(read("messages/en.json")) as Record<string, unknown>;
    const tr = JSON.parse(read("messages/tr.json")) as Record<string, unknown>;
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
    expect(messageKeys("en", "nav")).toEqual(messageKeys("tr", "nav"));
    expect(messageKeys("en", "footer")).toEqual(messageKeys("tr", "footer"));
    expect(messageKeys("en", "a11y")).toEqual(messageKeys("tr", "a11y"));
  });
});
