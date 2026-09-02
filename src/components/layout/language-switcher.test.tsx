// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../../../tests/helpers/render";
import { LanguageSwitcher } from "./language-switcher";

let currentTemplate = "/about";
let currentParams: Record<string, string> = {};

vi.mock("@/i18n/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/i18n/navigation")>();
  return {
    ...actual,
    usePathname: () => currentTemplate,
    useParams: () => currentParams,
  };
});

beforeEach(() => {
  currentTemplate = "/about";
  currentParams = {};
});

describe("LanguageSwitcher", () => {
  it("shows TR then EN, default locale first, with an sr-only language name for each", () => {
    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "TR (Türkçe)",
      "EN (English)",
    ]);
  });

  it("sets lang and hrefLang on every locale link", () => {
    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />);
    const en = screen.getByRole("link", { name: /EN/ });
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(en).toHaveAttribute("lang", "en");
    expect(en).toHaveAttribute("hrefLang", "en");
    expect(tr).toHaveAttribute("lang", "tr");
    expect(tr).toHaveAttribute("hrefLang", "tr");
  });

  it("marks the active locale with aria-current and leaves the other unmarked", () => {
    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />, {
      locale: "en",
    });
    const en = screen.getByRole("link", { name: /EN/ });
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(en).toHaveAttribute("aria-current", "true");
    expect(tr).not.toHaveAttribute("aria-current");
  });

  it("points the target locale at the section root when the path has no translation", () => {
    renderWithIntl(
      <LanguageSwitcher untranslated={{ en: [], tr: ["/about"] }} />
    );
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(tr).toHaveAttribute("href", "/");
  });

  it("keeps the translated path when one exists", () => {
    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />);
    const en = screen.getByRole("link", { name: /EN/ });
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(en).toHaveAttribute("href", "/en/about");
    expect(tr).toHaveAttribute("href", "/hakkimda");
  });

  it("fills dynamic params instead of linking the template on detail pages", () => {
    // With a pathnames map, usePathname() returns "/blog/[slug]"; before the
    // 2026-08-31 fix the switcher rendered that template into both hrefs.
    currentTemplate = "/blog/[slug]";
    currentParams = { slug: "self-hosting-with-coolify" };

    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />);

    const en = screen.getByRole("link", { name: /EN/ });
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(en).toHaveAttribute("href", "/en/blog/self-hosting-with-coolify");
    expect(tr).toHaveAttribute("href", "/blog/self-hosting-with-coolify");
    expect(en.getAttribute("href")).not.toContain("[slug]");
  });

  it("falls back to the section root for an untranslated detail page", () => {
    currentTemplate = "/blog/[slug]";
    currentParams = { slug: "capt-sinavina-hazirlik" };

    renderWithIntl(
      <LanguageSwitcher
        untranslated={{ en: ["/blog/capt-sinavina-hazirlik"], tr: [] }}
      />
    );

    expect(screen.getByRole("link", { name: /EN/ })).toHaveAttribute(
      "href",
      "/en/blog"
    );
  });
});
