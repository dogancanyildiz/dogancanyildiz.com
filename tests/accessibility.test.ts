import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isNavItemActive } from "@/lib/nav";

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
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listClientComponentFiles(full));
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry)) continue;
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
