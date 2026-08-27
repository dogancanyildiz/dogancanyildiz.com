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
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
  });

  it("shows the DCY monogram instead of a hard coded Portfolio eyebrow", () => {
    expect(source).not.toContain(">Portfolio<");
    expect(source).toContain('t("brand.monogram")');
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
