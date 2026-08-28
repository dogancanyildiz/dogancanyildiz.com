import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

describe("contact form live regions", () => {
  const form = read("src/components/sections/contact-form.tsx");

  it("announces the error state assertively", () => {
    expect(form).toContain('role="alert"');
  });

  it("announces the success state politely", () => {
    expect(form).toContain('role="status"');
  });

  it("marks the submit button busy while the request is in flight", () => {
    expect(form).toContain('aria-busy={status === "loading"}');
  });

  it("keeps the honeypot hidden from assistive tech", () => {
    expect(form).toContain('aria-hidden="true"');
    expect(form).toContain("tabIndex={-1}");
  });
});

describe("focus ring", () => {
  const css = read("src/app/globals.css");

  it("uses a solid two pixel ring with a two pixel offset", () => {
    expect(css).toMatch(
      /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ring\)/
    );
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline-offset:\s*2px/);
  });

  it("dropped the translucent default outline on the universal selector", () => {
    expect(css).not.toContain("outline-ring/50");
  });

  it("ships a skip link utility", () => {
    expect(css).toContain(".skip-link");
  });
});

describe("focus ring survives on form controls", () => {
  it("never pairs outline-none with focus-visible:outline-2 in src/components/ui", () => {
    const files = [
      "src/components/ui/button.tsx",
      "src/components/ui/input.tsx",
      "src/components/ui/textarea.tsx",
    ];
    for (const file of files) {
      const source = read(file);
      const hasOutlineNone = /\boutline-none\b/.test(source);
      const hasFocusVisibleOutline = source.includes("focus-visible:outline-2");
      expect(
        hasOutlineNone && hasFocusVisibleOutline,
        `${file} pairs outline-none with focus-visible:outline-2, which zeroes out the ring in the same @layer utilities pass`
      ).toBe(false);
    }
  });
});

describe("target size", () => {
  it("gives every icon-only control at least 44 CSS px", () => {
    for (const file of [
      "src/components/layout/mobile-menu.tsx",
      "src/components/layout/theme-toggle.tsx",
      "src/components/layout/footer.tsx",
      "src/components/layout/language-switcher.tsx",
      "src/components/layout/header.tsx",
    ]) {
      expect(read(file), `${file} has no tap-target`).toContain("tap-target");
    }
  });

  it("keeps the tap-target utility at 44px", () => {
    expect(read("src/app/globals.css")).toMatch(
      /\.tap-target\s*\{[^}]*min-h-11[^}]*min-w-11/
    );
  });
});

describe("theme toggle reflects the resolved theme", () => {
  const source = read("src/components/layout/theme-toggle.tsx");

  it("reads resolvedTheme instead of the raw (possibly 'system') theme value", () => {
    expect(source).toContain("resolvedTheme");
    expect(source).not.toMatch(/\btheme === "dark"/);
  });

  it("labels the button from the message catalog", () => {
    expect(source).not.toContain('aria-label="Toggle theme"');
    expect(
      source.match(/aria-label=\{t\("a11y\.toggleTheme"\)\}/g)
    ).toHaveLength(1);
  });

  it("renders a single button, not a separate pre-mount fallback", () => {
    // The icon swap is a CSS dark: variant, so there is nothing left that
    // has to differ between the server render and the hydrated client
    // render: one Button, not a disabled placeholder plus a live one.
    expect(source).not.toContain("disabled");
    expect(source.match(/<Button/g)).toHaveLength(1);
  });

  it("swaps icons with the dark: variant instead of a JS branch", () => {
    expect(source).toContain("dark:hidden");
    expect(source).toContain("dark:block");
  });

  it("reports its state via aria-pressed", () => {
    expect(source).toContain('aria-pressed={resolvedTheme === "dark"}');
  });
});

describe("skip link", () => {
  it("keeps its padding once it becomes visible", () => {
    // not-sr-only resets padding to 0 and the :focus-visible rule outranks
    // .skip-link, so the inset has to be restated inside the focus rule.
    expect(read("src/app/globals.css")).toMatch(
      /\.skip-link:focus-visible\s*\{[^}]*padding:\s*0\.5rem 1rem/
    );
  });

  it("targets a main landmark that can actually receive focus", () => {
    expect(read("src/app/[lang]/layout.tsx")).toMatch(
      /<main[^>]*id="main"[^>]*tabIndex=\{-1\}/
    );
  });

  it("gives the main landmark its own visible focus ring instead of hiding it", () => {
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).not.toContain("focus-visible:outline-none");
    expect(layout).toContain("focus-visible:outline-2");
    expect(layout).toContain("focus-visible:outline-offset-[-2px]");
    expect(layout).toContain("focus-visible:outline-ring");
  });
});

describe("sticky footer layout", () => {
  it("makes body a flex column so footer mt-auto has a track to grow into", () => {
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).toMatch(/<body\b[^>]*className="[^"]*\bflex\b/);
    expect(layout).toMatch(/<body\b[^>]*className="[^"]*\bmin-h-screen\b/);
    expect(layout).toMatch(/<body\b[^>]*className="[^"]*\bflex-col\b/);
  });

  it("drops the fixed viewport-relative min height on main in favour of flex-1", () => {
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).not.toContain("min-h-[calc(100vh-7rem)]");
    expect(layout).toMatch(/<main\b[^>]*className="[^"]*\bflex-1\b/);
  });

  it("keeps mt-auto on the footer now that it has an effect", () => {
    expect(read("src/components/layout/footer.tsx")).toContain("mt-auto");
  });
});

describe("theme-color viewport export", () => {
  it("declares a light and dark theme-color that match the background token", () => {
    const layout = read("src/app/[lang]/layout.tsx");
    expect(layout).toMatch(/export const viewport:\s*Viewport\s*=/);
    expect(layout).toContain(
      '{ media: "(prefers-color-scheme: light)", color: "#f9fafb" }'
    );
    expect(layout).toContain(
      '{ media: "(prefers-color-scheme: dark)", color: "#0a0c0f" }'
    );
  });
});

describe("client message payload", () => {
  const layout = read("src/app/[lang]/layout.tsx");
  const namespaceListMatch = layout.match(
    /CLIENT_MESSAGE_NAMESPACES = \[([\s\S]*?)\] as const/
  );
  const namespaceList = namespaceListMatch?.[1] ?? "";

  it("narrows NextIntlClientProvider to the namespaces client components use", () => {
    expect(layout).toContain(
      "pickMessages(messages, CLIENT_MESSAGE_NAMESPACES)"
    );
    expect(layout).not.toMatch(/<NextIntlClientProvider>/);
    expect(namespaceListMatch).not.toBeNull();
  });

  it("includes every namespace a client component still reads through useTranslations", () => {
    for (const namespace of [
      "nav",
      "brand",
      "hero",
      "home",
      "footer",
      "projects",
      "blog",
      "contact",
      "a11y",
    ]) {
      expect(namespaceList).toContain(`"${namespace}"`);
    }
  });

  it("leaves out namespaces that only ever render through getTranslations on the server", () => {
    for (const namespace of [
      "about",
      "notFound",
      "metadata",
      "api",
      "systems",
    ]) {
      expect(namespaceList).not.toContain(`"${namespace}"`);
    }
  });
});

describe("language switcher", () => {
  const source = read("src/components/layout/language-switcher.tsx");

  it("keeps the visible TR/EN label instead of letting aria-label override it", () => {
    expect(source).not.toContain("aria-label={localeNames[locale]}");
    expect(source).toContain("{localeLabels[locale]}");
    expect(source).toContain(
      '<span className="sr-only"> ({localeNames[locale]})</span>'
    );
  });

  it("sets lang alongside hrefLang on each locale link", () => {
    expect(source).toContain("hrefLang={locale}");
    expect(source).toContain("lang={locale}");
  });
});

describe("brand link", () => {
  it("stops the aria-label from overriding the sr-only brand name", () => {
    const source = read("src/components/layout/header.tsx");
    expect(source).not.toContain('aria-label={tBrand("name")}');
    expect(source).toContain(
      '<span className="sr-only">{tBrand("name")}</span>'
    );
  });
});

describe("desktop nav active state", () => {
  it("computes aria-current and the active class from one shared helper", () => {
    const source = read("src/components/layout/header.tsx");
    expect(source.match(/isNavItemActive\(pathname, href\)/g)).toHaveLength(1);
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
  });

  it("does not match a sibling route by prefix", () => {
    const nav = read("src/lib/nav.ts");
    expect(nav).toContain(
      "return pathname === href || pathname.startsWith(`${href}/`);"
    );
  });
});

describe("mobile menu active state", () => {
  it("marks the current route with aria-current, driven by the shared nav pathname helper", () => {
    const source = read("src/components/layout/mobile-menu.tsx");
    expect(source).toContain("usePathname");
    expect(source).toContain("isNavItemActive(pathname, href)");
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
  });
});

describe("about subnav", () => {
  it("tracks the section in view instead of never marking anything current", () => {
    const list = read("src/components/sections/about-subnav-list.tsx");
    expect(list).toContain("IntersectionObserver");
    expect(list).toContain('aria-current={isActive ? "location" : undefined}');
  });

  it("filters optional sections through an isVisible predicate, not a hard coded id", () => {
    const source = read("src/components/sections/about-subnav.tsx");
    expect(source).not.toContain("optional");
    expect(source).not.toContain('section.id === "about-speaking"');
    expect(source).toContain("isVisible?.() ?? true");
  });
});
