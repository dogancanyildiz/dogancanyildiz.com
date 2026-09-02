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

/** Shaped like buildTranslationMap("tr"): keyed by the Turkish slug. */
const TRANSLATIONS = {
  post: {
    "coolify-ile-kendi-sunucumda": {
      tr: "/yazilar/coolify-ile-kendi-sunucumda",
      en: "/en/blog/self-hosting-with-coolify",
    },
    "sadece-turkce": { tr: "/yazilar/sadece-turkce" },
  },
  project: {
    "not-ortalamasi-hesaplayici": {
      tr: "/projeler/not-ortalamasi-hesaplayici",
      en: "/en/projects/gpa-calculator",
    },
  },
};

const EMPTY = { post: {}, project: {} };

function hrefs() {
  return {
    en: screen.getByRole("link", { name: /EN/ }).getAttribute("href"),
    tr: screen.getByRole("link", { name: /TR/ }).getAttribute("href"),
  };
}

describe("LanguageSwitcher", () => {
  it("shows TR then EN, default locale first, with an sr-only language name for each", () => {
    renderWithIntl(<LanguageSwitcher translations={EMPTY} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "TR (Türkçe)",
      "EN (English)",
    ]);
  });

  it("sets lang and hrefLang on every locale link", () => {
    renderWithIntl(<LanguageSwitcher translations={EMPTY} />);
    const en = screen.getByRole("link", { name: /EN/ });
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(en).toHaveAttribute("lang", "en");
    expect(en).toHaveAttribute("hrefLang", "en");
    expect(tr).toHaveAttribute("lang", "tr");
    expect(tr).toHaveAttribute("hrefLang", "tr");
  });

  it("marks the active locale with aria-current and leaves the other unmarked", () => {
    renderWithIntl(<LanguageSwitcher translations={EMPTY} />, {
      locale: "en",
    });
    const en = screen.getByRole("link", { name: /EN/ });
    const tr = screen.getByRole("link", { name: /TR/ });
    expect(en).toHaveAttribute("aria-current", "true");
    expect(tr).not.toHaveAttribute("aria-current");
  });

  it("localizes a static page through the pathnames map", () => {
    renderWithIntl(<LanguageSwitcher translations={EMPTY} />);
    expect(hrefs()).toEqual({ en: "/en/about", tr: "/hakkimda" });
  });

  it("sends both locales to their own section root on a list page", () => {
    currentTemplate = "/blog";
    renderWithIntl(<LanguageSwitcher translations={TRANSLATIONS} />, {
      locale: "tr",
    });
    expect(hrefs()).toEqual({ en: "/en/blog", tr: "/yazilar" });
  });

  it("points each locale at its own slug on a content detail page", () => {
    currentTemplate = "/blog/[slug]";
    currentParams = { slug: "coolify-ile-kendi-sunucumda" };

    renderWithIntl(<LanguageSwitcher translations={TRANSLATIONS} />, {
      locale: "tr",
    });

    expect(hrefs()).toEqual({
      en: "/en/blog/self-hosting-with-coolify",
      tr: "/yazilar/coolify-ile-kendi-sunucumda",
    });
    expect(hrefs().en).not.toContain("[slug]");
  });

  it("does the same for a project detail page", () => {
    currentTemplate = "/projects/[slug]";
    currentParams = { slug: "not-ortalamasi-hesaplayici" };

    renderWithIntl(<LanguageSwitcher translations={TRANSLATIONS} />, {
      locale: "tr",
    });

    expect(hrefs()).toEqual({
      en: "/en/projects/gpa-calculator",
      tr: "/projeler/not-ortalamasi-hesaplayici",
    });
  });

  /**
   * usePathname() does not have one shape. On a Turkish detail page the
   * server renders from the RSC payload's canonical url, which is the
   * internal route (/tr/blog/<tr-slug>), so the hook returns the concrete
   * /blog/<tr-slug>; after hydration it reads window.location
   * (/yazilar/<tr-slug>) and next-intl's getRoute matches the Turkish
   * template and hands back /blog/[slug]. Deriving the target from the
   * pathname's shape produced a different href on each side, which is both a
   * hydration mismatch and a 404 in the prerendered HTML.
   */
  const SHAPES = [
    ["client template", "/blog/[slug]"],
    ["server concrete path", "/blog/coolify-ile-kendi-sunucumda"],
    ["localized path", "/yazilar/coolify-ile-kendi-sunucumda"],
  ] as const;

  for (const [label, shape] of SHAPES) {
    it(`resolves the detail page from the ${label} shape`, () => {
      currentTemplate = shape;
      currentParams = { slug: "coolify-ile-kendi-sunucumda" };

      renderWithIntl(<LanguageSwitcher translations={TRANSLATIONS} />, {
        locale: "tr",
      });

      expect(hrefs()).toEqual({
        en: "/en/blog/self-hosting-with-coolify",
        tr: "/yazilar/coolify-ile-kendi-sunucumda",
      });
    });
  }

  it("renders the same hrefs from every pathname shape", () => {
    const rendered = SHAPES.map(([, shape]) => {
      currentTemplate = shape;
      currentParams = { slug: "coolify-ile-kendi-sunucumda" };
      const view = renderWithIntl(
        <LanguageSwitcher translations={TRANSLATIONS} />,
        { locale: "tr" }
      );
      const result = Array.from(view.container.querySelectorAll("a")).map(
        (link) => link.getAttribute("href")
      );
      view.unmount();
      return result;
    });

    for (const shape of rendered) {
      expect(shape).toEqual(rendered[0]);
    }
  });

  it("falls back to the section root for an untranslated detail page", () => {
    currentTemplate = "/blog/[slug]";
    currentParams = { slug: "sadece-turkce" };

    renderWithIntl(<LanguageSwitcher translations={TRANSLATIONS} />, {
      locale: "tr",
    });

    expect(hrefs()).toEqual({
      en: "/en/blog",
      tr: "/yazilar/sadece-turkce",
    });
  });

  it("falls back to the section root when the map has no entry at all", () => {
    // Never linked to /blog/[slug] literally: handing a dynamic template to
    // pathnameForLocale throws "Insufficient params provided for localized
    // pathname" and takes the whole client tree down with it.
    currentTemplate = "/blog/[slug]";
    currentParams = { slug: "coolify-ile-kendi-sunucumda" };

    renderWithIntl(<LanguageSwitcher translations={EMPTY} />, {
      locale: "tr",
    });

    expect(hrefs()).toEqual({ en: "/en/blog", tr: "/yazilar" });
  });
});
