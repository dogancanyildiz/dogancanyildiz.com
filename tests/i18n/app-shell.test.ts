import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoPath = (relative: string) => join(process.cwd(), relative);
const read = (relative: string) => readFileSync(repoPath(relative), "utf8");
const exists = (relative: string) => existsSync(repoPath(relative));

const LANG_ROUTES = [
  "src/app/[lang]/layout.tsx",
  "src/app/[lang]/page.tsx",
  "src/app/[lang]/about/page.tsx",
  "src/app/[lang]/projects/page.tsx",
  "src/app/[lang]/projects/[slug]/page.tsx",
  "src/app/[lang]/contact/page.tsx",
  "src/app/[lang]/opengraph-image.tsx",
];

const REMOVED_ROUTES = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/about/layout.tsx",
  "src/app/about/page.tsx",
  "src/app/projects/layout.tsx",
  "src/app/projects/page.tsx",
  "src/app/projects/[slug]/page.tsx",
  "src/app/contact/layout.tsx",
  "src/app/contact/page.tsx",
  "src/app/contact/contact-page-content.tsx",
  "src/app/opengraph-image.tsx",
];

function proxyMatcher(): string {
  const source = read("src/proxy.ts");
  const match = source.match(/matcher:\s*"([^"]+)"/);
  if (!match) throw new Error("proxy.ts does not declare a string matcher");
  // The file is TypeScript source, so the backslashes are still escaped.
  return JSON.parse(`"${match[1]}"`) as string;
}

describe("proxy", () => {
  it("uses the Next 16 proxy convention instead of middleware.ts", () => {
    expect(exists("src/proxy.ts")).toBe(true);
    expect(exists("src/middleware.ts")).toBe(false);
  });

  it("builds the middleware from the shared routing config", () => {
    const source = read("src/proxy.ts");
    expect(source).toContain('from "next-intl/middleware"');
    expect(source).toContain('from "@/i18n/routing"');
    expect(source).toContain("createMiddleware(routing)");
  });

  it("matches page routes and skips api, framework and file paths", () => {
    const pattern = new RegExp(`^${proxyMatcher()}$`);

    for (const pathname of ["/", "/tr", "/about", "/tr/about", "/projects/a"]) {
      expect(pattern.test(pathname), pathname).toBe(true);
    }

    for (const pathname of [
      "/api/contact",
      "/api/health",
      "/_next/static/chunk.js",
      "/_vercel/insights",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/cv.pdf",
    ]) {
      expect(pattern.test(pathname), pathname).toBe(false);
    }
  });
});

describe("app/[lang] route tree", () => {
  it.each(LANG_ROUTES)("has %s", (route) => {
    expect(exists(route)).toBe(true);
  });

  it.each(REMOVED_ROUTES)("no longer has %s", (route) => {
    expect(exists(route)).toBe(false);
  });

  it.each(LANG_ROUTES)("prerenders both locales from %s", (route) => {
    const source = read(route);
    expect(source).toContain("export function generateStaticParams()");
    expect(source).toContain('from "@/i18n/routing"');
  });

  it("opts every page into static rendering with setRequestLocale", () => {
    for (const route of LANG_ROUTES.filter(
      (item) => !item.endsWith("opengraph-image.tsx")
    )) {
      expect(read(route), route).toContain("setRequestLocale(lang)");
    }
  });

  it("keeps the html lang attribute and metadataBase in the root layout", () => {
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).toContain("<html lang={lang}");
    // Dropping this resolves og:image against localhost, see docs/plans/handoffs/faz-1.md.
    expect(layout).toContain("metadataBase: new URL(siteUrl())");
  });

  it("puts the vendored font className on <html>, not <body>", () => {
    // fontVariables carries the CSS custom properties (--font-sans-latin
    // etc.) that globals.css's :root font stacks consume. :root sits above
    // <body> in the tree, so a copy of the class on <body> leaves those
    // properties undefined at :root and every stack falls through to its
    // system fallback. See docs/plans/handoffs/faz-3.md.
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).toContain('import { fontVariables } from "@/fonts"');
    expect(layout).toMatch(/<html\b[^>]*className=\{fontVariables\}/);
    expect(layout).not.toMatch(/<body\b[^>]*fontVariables/);
  });

  it("keeps the og image off the edge runtime", () => {
    expect(read("src/app/[lang]/opengraph-image.tsx")).not.toMatch(
      /\bruntime\b/
    );
  });
});

describe("application shell", () => {
  it("routes through the locale aware navigation helpers", () => {
    for (const component of [
      "src/components/layout/header.tsx",
      "src/components/layout/footer.tsx",
      "src/components/layout/language-switcher.tsx",
    ]) {
      const source = read(component);
      expect(source, component).toContain('from "@/i18n/navigation"');
      expect(source, component).not.toContain('from "next/link"');
      expect(source, component).not.toContain('from "next/navigation"');
      expect(source, component).not.toContain(
        'from "@/components/locale-provider"'
      );
    }
  });

  it("switches language by URL, never by cookie", () => {
    const source = read("src/components/layout/language-switcher.tsx");
    // getPathname honours localePrefix "as-needed", so the English link is
    // /about and not /en/about, which the proxy answers with a 307. Link with
    // an explicit locale prop always forces the prefix.
    expect(source).toContain("getPathname({ locale, href: pathname })");
    expect(source).not.toContain("locale={locale}");
    expect(source).not.toContain("setLocale");
    expect(source).not.toContain("document.cookie");
  });

  it("moved the page bodies into reusable section components", () => {
    expect(exists("src/components/sections/about-content.tsx")).toBe(true);
    expect(exists("src/components/sections/contact-page-content.tsx")).toBe(
      true
    );
    expect(read("src/components/sections/about-content.tsx")).toContain(
      "export function AboutContent()"
    );
    expect(read("src/components/sections/contact-page-content.tsx")).toContain(
      "export function ContactPageContent()"
    );
  });
});

describe("404 pages", () => {
  it("answers unmatched paths with a full document, not a bare shell", () => {
    // The root layout lives under [lang], so nothing wraps a path that never
    // resolves to a locale. global-not-found.tsx has to bring its own document.
    const source = read("src/app/global-not-found.tsx");
    expect(source).toMatch(/<html\b[^>]*\blang=/);
    expect(source).toContain('import "./globals.css"');
    expect(source).toContain('namespace: "notFound"');
  });

  it("turns the global-not-found convention on", () => {
    // Next 16.3.3 ignores src/app/global-not-found.tsx without this flag.
    const config = read("next.config.ts");
    expect(config).toMatch(/experimental:\s*\{[\s\S]*globalNotFound:\s*true/);
  });

  it("keeps unknown locale segments out of the render path", () => {
    // Without this the proxy skipped path /foo.txt matches [lang], the layout
    // throws notFound() at request time and Next answers with a document that
    // has no lang attribute and no stylesheet.
    expect(read("src/app/[lang]/layout.tsx")).toContain(
      "export const dynamicParams = false"
    );
  });
});

describe("global-not-found font parity", () => {
  it("carries the same vendored font className the [lang] layout uses", () => {
    const source = read("src/app/global-not-found.tsx");
    expect(source).toContain('import { fontVariables } from "@/fonts"');
    // The vendored font variable classes have to sit on <html>: that is the
    // element the CSS custom properties they define are computed on, and
    // globals.css's :root font stacks consume those properties. A copy on
    // <body> instead leaves --font-sans-latin etc. undefined at :root, so
    // every stack falls straight through to its system fallback. See
    // docs/plans/handoffs/faz-3.md.
    expect(source).toMatch(/<html\b[^>]*className=\{fontVariables\}/);
    expect(source).not.toMatch(/<body\b[^>]*fontVariables/);
  });

  it("has a localized boundary for notFound() thrown inside a locale", () => {
    const source = read("src/app/[lang]/not-found.tsx");
    expect(source).toContain('useTranslations("notFound")');
    expect(source).toContain('from "@/i18n/navigation"');
    expect(source).not.toContain('from "next/link"');
  });

  it("carries the same notFound keys in both catalogs", () => {
    const keys = (locale: string) =>
      Object.keys(
        (JSON.parse(read(`messages/${locale}.json`)) as Record<string, unknown>)
          .notFound as Record<string, unknown>
      ).sort();

    expect(keys("en")).toEqual(["backHome", "code", "description", "title"]);
    expect(keys("tr")).toEqual(keys("en"));
  });
});

const LINK_USING_CONTENT_COMPONENTS = [
  "src/components/sections/hero.tsx",
  "src/components/sections/featured-projects.tsx",
  "src/components/sections/project-card.tsx",
  "src/components/sections/project-detail.tsx",
  "src/components/sections/about-content.tsx",
];

const CONTENT_COMPONENTS = [
  ...LINK_USING_CONTENT_COMPONENTS,
  "src/components/sections/skills-strip.tsx",
  "src/components/sections/projects-section.tsx",
  "src/components/sections/contact-form.tsx",
  "src/components/sections/contact-page-content.tsx",
];

// contact-form.tsx picks up useLocale from next-intl in Task 7 Step 3 to send
// the locale with the contact request, so it is excluded here. The
// from-locale-provider guard below already proves the old cookie based
// useLocale is gone from every content component, including this one.
const NO_USE_LOCALE_HOOK_COMPONENTS = CONTENT_COMPONENTS.filter(
  (component) => component !== "src/components/sections/contact-form.tsx"
);

describe("content components", () => {
  it.each(CONTENT_COMPONENTS)(
    "reads messages through next-intl in %s",
    (component) => {
      const source = read(component);
      expect(source, component).toContain('from "next-intl"');
      expect(source, component).toContain("useTranslations()");
      expect(source, component).not.toContain(
        'from "@/components/locale-provider"'
      );
    }
  );

  it.each(NO_USE_LOCALE_HOOK_COMPONENTS)(
    "does not need the useLocale hook in %s",
    (component) => {
      expect(read(component), component).not.toContain("useLocale");
    }
  );

  it.each(LINK_USING_CONTENT_COMPONENTS)(
    "routes through the locale aware Link in %s",
    (component) => {
      const source = read(component);
      expect(source, component).toContain('from "@/i18n/navigation"');
      expect(source, component).not.toContain('from "next/link"');
    }
  );

  it("drops the transitional LocaleProvider from the root layout", () => {
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).not.toContain('from "@/components/locale-provider"');
    expect(layout).not.toContain("LocaleProvider");
  });

  it("removes the cookie based dictionary layer entirely", () => {
    expect(exists("src/lib/i18n/translations.ts")).toBe(false);
    expect(exists("src/lib/i18n/use-translation.ts")).toBe(false);
    expect(exists("src/components/locale-provider.tsx")).toBe(false);
  });
});
