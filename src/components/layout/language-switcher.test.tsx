// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../../../tests/helpers/render";
import { LanguageSwitcher } from "./language-switcher";

// The component reads its current path and builds each locale's href through
// @/i18n/navigation, next-intl's wrapper around next/navigation. Mocking the
// wrapper directly (rather than next/navigation underneath it) sidesteps the
// App Router context that real next/navigation hooks require and that jsdom
// has no way to provide.
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/about",
  getPathname: ({ locale, href }: { locale: string; href: string }) =>
    locale === "en" ? href : `/${locale}${href === "/" ? "" : href}`,
}));

describe("LanguageSwitcher", () => {
  it("shows the TR/EN labels with an sr-only language name for each", () => {
    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "EN (English)",
      "TR (Türkçe)",
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
    expect(tr).toHaveAttribute("href", "/tr");
  });

  it("keeps the translated path when one exists", () => {
    renderWithIntl(<LanguageSwitcher untranslated={{ en: [], tr: [] }} />);
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(tr).toHaveAttribute("href", "/tr/about");
  });
});
