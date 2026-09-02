// @vitest-environment jsdom
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { isNavItemActive } from "@/lib/nav";
import { renderWithIntl, resolveServerTree } from "./helpers/render";

// This file is .ts, not .tsx, so the render cases below build their elements
// with createElement instead of JSX. Renaming it would move a path other
// suites and the audit trail refer to by name, which is not worth the syntax.

// next-intl's Link and usePathname reach for an App Router context jsdom
// cannot provide, the same substitution the layout component suites make
// (see src/components/layout/mobile-menu.test.tsx).
vi.mock("@/i18n/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/i18n/navigation")>();
  return {
    ...actual,
    usePathname: () => "/about",
    useParams: () => ({}),
    Link: ({
      href,
      children,
      ...props
    }: { href: string; children?: ReactNode } & Record<string, unknown>) =>
      createElement("a", { href, ...props }, children),
  };
});

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: () => {} }),
}));

// The Footer is a server component: it reads getTranslations/getLocale from
// the request scope this render never enters, so both are served from the
// real English catalog instead.
vi.mock("next-intl/server", async () => {
  const messages = (await import("../messages/en.json")).default as Record<
    string,
    unknown
  >;
  return {
    getLocale: async () => "en",
    getTranslations: async (arg?: string | { namespace?: string }) => {
      const namespace = typeof arg === "string" ? arg : arg?.namespace;
      return (key: string, values?: Record<string, unknown>) => {
        const path = namespace ? `${namespace}.${key}` : key;
        const raw = path
          .split(".")
          .reduce<unknown>(
            (node, segment) => (node as Record<string, unknown>)?.[segment],
            messages
          );
        if (typeof raw !== "string") {
          throw new Error(`missing message key: en.${path}`);
        }
        if (!values) return raw;
        return Object.entries(values).reduce(
          (text, [name, value]) => text.replace(`{${name}}`, String(value)),
          raw
        );
      };
    },
  };
});

const { Header } = await import("@/components/layout/header");
const { Footer } = await import("@/components/layout/footer");
const { MobileMenu } = await import("@/components/layout/mobile-menu");
const { ContactPageContent } =
  await import("@/components/sections/contact-page-content");
const { default: LocaleError } = await import("@/app/[lang]/error");

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

// The former "contact form live regions" describe here (role=status/alert
// present, aria-busy wired to the loading state, the honeypot hidden from
// assistive tech) is now exercised as real behaviour in
// src/components/sections/contact-form.test.tsx: the live regions are
// asserted present and their text checked across the idle, loading and
// error states, aria-busy is asserted true while a request is in flight, and
// the honeypot's aria-hidden wrapper and tabIndex are asserted directly.

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
      "src/components/ui/native-select.tsx",
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

// Tailwind's spacing scale is 0.25rem a step and the root font size is the
// browser default 16px, so `min-h-11` resolves to 44 CSS px.
const SPACING_STEP_PX = 4;
/** WCAG 2.2 SC 2.5.8 asks 24; F-062 set 44 for the site's own chrome. */
const TARGET_FLOOR_PX = 44;
const MINIMUM_FLOOR_PX = 24;

/**
 * The smallest height, in CSS px, a class list guarantees at the base
 * breakpoint. jsdom applies no stylesheet, so the box is derived from the
 * utilities themselves rather than measured: getBoundingClientRect would
 * report 0 for every element here and pass by accident.
 *
 * Anything carrying a variant (`sm:`, `hover:`) is skipped on purpose. A
 * target has to be large enough before a breakpoint or a state applies, so a
 * size that only arrives with one does not count.
 */
function guaranteedHeightPx(className: string): number | null {
  let height: number | null = null;
  for (const token of className.split(/\s+/)) {
    if (!token || token.includes(":")) continue;
    // .tap-target is `min-h-11 min-w-11`, asserted below straight from the
    // stylesheet so this number cannot drift away from the rule.
    if (token === "tap-target") {
      height = Math.max(height ?? 0, 44);
      continue;
    }
    // min-h wins over h and size in the cascade, and all three are read as a
    // floor here: a control that sets both keeps the larger of the two.
    const match = /^(?:min-h|h|size)-(\d+(?:\.\d+)?)$/.exec(token);
    if (match?.[1]) {
      height = Math.max(height ?? 0, Number(match[1]) * SPACING_STEP_PX);
    }
  }
  return height;
}

/** Every link and button the render produced, with its derived height. */
function measuredTargets(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>("a, button")]
    .filter((element) => element.closest("[aria-hidden='true']") === null)
    .map((element) => ({
      element,
      label: `${element.tagName.toLowerCase()} "${(element.textContent ?? "").trim() || element.getAttribute("aria-label") || element.getAttribute("href")}"`,
      height: guaranteedHeightPx(element.className),
    }));
}

// The former string search here ("every one of these files mentions
// tap-target somewhere") could not see a regression: footer.tsx kept the
// word for its email link while every other footer link dropped to min-h-6,
// and the assertion stayed green. These render the surfaces instead and read
// the floor off each control that comes out.
describe("target size", () => {
  it("keeps the tap-target utility at 44px", () => {
    expect(read("src/app/globals.css")).toMatch(
      /\.tap-target\s*\{[^}]*min-h-11[^}]*min-w-11/
    );
  });

  it("measures what it is supposed to measure", () => {
    expect(guaranteedHeightPx("tap-target inline-flex")).toBe(44);
    expect(guaranteedHeightPx("min-h-6 items-center")).toBe(24);
    expect(guaranteedHeightPx("size-9 rounded-full")).toBe(36);
    expect(guaranteedHeightPx("h-9 min-h-11")).toBe(44);
    expect(guaranteedHeightPx("sm:min-h-11 flex")).toBeNull();
    expect(guaranteedHeightPx("flex items-center gap-2")).toBeNull();
  });

  it("gives every header control at least 44 CSS px", () => {
    const { container } = renderWithIntl(
      createElement(Header, { untranslated: { en: [], tr: [] } })
    );
    const targets = measuredTargets(container);
    expect(targets.length).toBeGreaterThan(5);
    for (const { label, height } of targets) {
      expect(height, `header ${label} has no height floor`).not.toBeNull();
      expect(height, `header ${label}`).toBeGreaterThanOrEqual(TARGET_FLOOR_PX);
    }
  });

  it("gives every footer link at least 44 CSS px", async () => {
    const { container } = render(
      await resolveServerTree(createElement(Footer))
    );
    const targets = measuredTargets(container);
    // Five nav routes, privacy, email, WhatsApp, GitHub, LinkedIn and the feed.
    expect(targets.length).toBeGreaterThanOrEqual(11);
    for (const { label, height } of targets) {
      expect(height, `footer ${label} has no height floor`).not.toBeNull();
      expect(height, `footer ${label}`).toBeGreaterThanOrEqual(TARGET_FLOOR_PX);
    }
  });

  it("gives every control inside the open mobile menu at least 44 CSS px", async () => {
    const user = userEvent.setup();
    renderWithIntl(createElement(MobileMenu));
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const panel = await screen.findByRole("dialog");

    const targets = measuredTargets(panel);
    expect(targets.length).toBeGreaterThan(5);
    for (const { label, height } of targets) {
      expect(height, `mobile menu ${label} has no height floor`).not.toBeNull();
      expect(height, `mobile menu ${label}`).toBeGreaterThanOrEqual(
        TARGET_FLOOR_PX
      );
    }
  });

  it("gives the error boundary's two ways out at least 44 CSS px", () => {
    // The boundary logs the original error from an effect; that console call
    // is the point of the component, not noise this test needs to see.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = renderWithIntl(
      createElement(LocaleError, {
        error: new Error("render failed"),
        retry: () => {},
      })
    );
    const targets = measuredTargets(container);
    expect(targets).toHaveLength(2);
    for (const { label, height } of targets) {
      expect(height, `error page ${label}`).toBeGreaterThanOrEqual(
        TARGET_FLOOR_PX
      );
    }
  });

  it("keeps the contact detail links above the 24px floor of SC 2.5.8", () => {
    // These two are not chrome controls, so they take the same 24px floor the
    // project card badges do rather than the 44px one. Neither sits inside a
    // sentence, so the inline exception to SC 2.5.8 does not cover them:
    // text-sm alone leaves a 20px line box.
    const { container } = renderWithIntl(createElement(ContactPageContent));
    for (const selector of [
      'a[href^="mailto:"]',
      'a[href^="https://wa.me/"]',
    ]) {
      const link = container.querySelector<HTMLElement>(selector);
      expect(link, `${selector} is missing`).not.toBeNull();
      expect(
        guaranteedHeightPx(link?.className ?? ""),
        selector
      ).toBeGreaterThanOrEqual(MINIMUM_FLOOR_PX);
    }
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

  it("swaps icons with the dark: variant instead of a JS branch", () => {
    expect(source).toContain("dark:hidden");
    expect(source).toContain("dark:block");
  });

  // "renders a single button, not a separate pre-mount fallback" and
  // "reports its state via aria-pressed" used to live here as source-text
  // checks; src/components/layout/theme-toggle.test.tsx now renders the
  // component and asserts exactly one button with aria-pressed tracking
  // resolvedTheme across the unmounted, dark and light states, which is
  // both a stronger and a more direct check on the same behaviour.
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

// Walks src/ and returns every file whose first non-blank line is the
// "use client" directive, so the namespace scan below covers exactly the
// components next-intl's client provider actually has to serve.
function listClientComponentFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listClientComponentFiles(full));
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    const source = readFileSync(full, "utf8");
    if (/^\s*["']use client["'];?/.test(source)) files.push(full);
  }
  return files;
}

// A namespaced key such as "hero.tagline" or "footer.github" requires the
// top level namespace before the first dot; a bare key such as "menu" comes
// from a hook already scoped to a namespace (useTranslations("nav")) and
// contributes nothing on its own.
function topLevelNamespace(key: string): string | null {
  if (!key.includes(".")) {
    return null;
  }
  return key.split(".")[0] ?? null;
}

// Parses every useTranslations(...) call in a client component's source and
// returns the set of message namespaces it needs: the hook's own explicit
// namespace argument, plus the namespace prefix of every string literal key
// passed to the variable it returns when the hook was called unscoped.
function requiredNamespaces(source: string): Set<string> {
  const required = new Set<string>();
  const hookPattern =
    /\bconst\s+(\w+)\s*=\s*useTranslations\((?:"([^"]+)")?\)/g;
  let hookMatch: RegExpExecArray | null;
  while ((hookMatch = hookPattern.exec(source))) {
    const [, varName, explicitNamespace] = hookMatch;
    if (explicitNamespace) {
      const top = topLevelNamespace(explicitNamespace) ?? explicitNamespace;
      required.add(top);
      continue;
    }
    const callPattern = new RegExp(`\\b${varName}\\(\\s*"([^"]+)"`, "g");
    let callMatch: RegExpExecArray | null;
    while ((callMatch = callPattern.exec(source))) {
      const callKey = callMatch[1];
      if (!callKey) continue;
      const namespace = topLevelNamespace(callKey);
      if (namespace) required.add(namespace);
    }
  }
  return required;
}

describe("client message payload", () => {
  const layout = read("src/app/[lang]/layout.tsx");
  const namespaceListMatch = layout.match(
    /CLIENT_MESSAGE_NAMESPACES = \[([\s\S]*?)\] as const/
  );
  const namespaceList = namespaceListMatch?.[1] ?? "";
  const declaredNamespaces = new Set(
    [...namespaceList.matchAll(/"([^"]+)"/g)].map((match) => match[1])
  );

  it("narrows NextIntlClientProvider to the namespaces client components use", () => {
    expect(layout).toContain(
      "pickMessages(messages, CLIENT_MESSAGE_NAMESPACES)"
    );
    expect(layout).not.toMatch(/<NextIntlClientProvider>/);
    expect(namespaceListMatch).not.toBeNull();
  });

  it('covers every namespace a "use client" component reads through useTranslations', () => {
    const clientFiles = listClientComponentFiles(join(process.cwd(), "src"));
    expect(clientFiles.length).toBeGreaterThan(0);

    const required = new Set<string>();
    for (const file of clientFiles) {
      for (const namespace of requiredNamespaces(readFileSync(file, "utf8"))) {
        required.add(namespace);
      }
    }

    const missing = [...required]
      .filter((namespace) => !declaredNamespaces.has(namespace))
      .sort();
    expect(missing).toEqual([]);
  });

  it("leaves out namespaces that only ever render through getTranslations on the server", () => {
    for (const namespace of [
      "about",
      "notFound",
      "metadata",
      "api",
      "systems",
      "privacy",
      "status",
    ]) {
      expect(namespaceList).not.toContain(`"${namespace}"`);
    }
  });
});

// The former "language switcher" describe here (visible TR/EN label not
// overridden by aria-label, lang/hrefLang on each link) is now
// src/components/layout/language-switcher.test.tsx: it renders the
// component and reads the link's computed accessible name and attributes
// directly, which an aria-label override would fail the same way a real
// screen reader user would notice it.

describe("brand link", () => {
  it("shows the brand name in the header instead of hiding it for assistive tech", () => {
    const source = read("src/components/layout/header.tsx");
    expect(source).not.toContain('aria-label={tBrand("name")}');
    expect(source).toContain('{tBrand("name")}');
    expect(source).not.toContain("sr-only");
  });

  it("puts the logo mark inside the same link without labelling it", () => {
    const source = read("src/components/layout/header.tsx");
    // Order matters: the mark reads first visually, and the link's accessible
    // name has to stay the name text alone, which is what the aria-hidden on
    // BrandMark (src/components/brand/brand-mark.tsx) buys.
    const markAt = source.indexOf("<BrandMark");
    const nameAt = source.indexOf('{tBrand("name")}');
    expect(markAt).toBeGreaterThan(-1);
    expect(markAt).toBeLessThan(nameAt);
    expect(source).not.toContain('aria-label={tBrand("name")}');
  });

  it("lets the name ellipsize rather than wrap when the row runs out", () => {
    // The mark added ~53px to a block that was the name alone, and the row is
    // a fixed h-16. truncate needs a min-w-0 ancestor to do anything, which is
    // what the link and its wrapper carry.
    const source = read("src/components/layout/header.tsx");
    expect(source).toMatch(/className="truncate text-sm[^"]*"/);
    expect(source).toContain("flex min-w-0 items-center gap-2.5");
  });
});

describe("desktop nav active state", () => {
  it("computes aria-current and the active class from one shared helper", () => {
    const source = read("src/components/layout/header.tsx");
    expect(source.match(/isNavItemActive\(pathname, href\)/g)).toHaveLength(1);
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
  });
});

describe("isNavItemActive", () => {
  it("matches the root item only on the exact root path", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/about", "/")).toBe(false);
  });

  it("matches an item on its own path and its subpaths", () => {
    expect(isNavItemActive("/about", "/about")).toBe(true);
    expect(isNavItemActive("/about/team", "/about")).toBe(true);
  });

  it("does not match a sibling route by prefix", () => {
    expect(isNavItemActive("/about-me", "/about")).toBe(false);
    expect(isNavItemActive("/projects/x", "/blog")).toBe(false);
  });
});

// The former "mobile menu active state" describe here (usePathname,
// isNavItemActive, aria-current on the active link) is now
// src/components/layout/mobile-menu.test.tsx, which opens the panel and
// asserts aria-current="page" lands on the link matching the current route
// and nowhere else.

describe("about subnav", () => {
  // "tracks the section in view instead of never marking anything current"
  // and "resolves the active section from a tracked set in items order, and
  // clears it once nothing intersects" used to live here as source-text
  // checks on about-subnav-list.tsx; src/components/sections/about-subnav-list.test.tsx
  // now drives a stand-in IntersectionObserver by hand and asserts
  // aria-current="location" lands on the right item, including the
  // topmost-of-several-intersecting and clears-when-nothing-intersects
  // cases the source checks could only infer from the code shape.

  it("filters optional sections through an isVisible predicate, not a hard coded id", () => {
    const source = read("src/components/sections/about-subnav.tsx");
    expect(source).not.toContain("optional");
    expect(source).not.toContain('section.id === "about-speaking"');
    expect(source).toContain("isVisible?.() ?? true");
  });
});
