import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  readOklchToken,
  relativeLuminance,
} from "./lib/contrast";

const repoPath = (relative: string) => join(process.cwd(), relative);
const read = (relative: string) => readFileSync(repoPath(relative), "utf8");

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
// Comments quote class names, layer names and braces. Anything that parses the
// stylesheet as structure has to read this copy instead.
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("typography tokens", () => {
  it("has no dangling --font-fraunces reference", () => {
    expect(css).not.toContain("--font-fraunces");
  });

  it("puts the vendored faces at the head of every font stack", () => {
    expect(css).toMatch(
      /--font-sans-stack:\s*var\(--font-sans-latin\),\s*var\(--font-sans-ext\)/
    );
    expect(css).toMatch(
      /--font-mono-stack:\s*var\(--font-mono-latin\),\s*var\(--font-mono-ext\)/
    );
  });

  it("aliases display to the serif stack with sans fallback", () => {
    expect(css).toMatch(
      /--font-display-stack:\s*var\(--font-display-latin\),\s*var\(--font-display-ext\),\s*var\(--font-sans-latin\)/
    );
  });

  it("uses Geist Sans for every heading level", () => {
    expect(css).toMatch(
      /h1,\s*\n\s*h2,\s*\n\s*h3,\s*\n\s*h4\s*\{[^}]*font-family:\s*var\(--font-sans-stack\)/
    );
  });

  it("keeps the display stack on the one editorial surface left", () => {
    // .pull-quote used to be the second one. It never had a call site, so it
    // was deleted rather than kept alive by this assertion.
    for (const selector of [".prose-content blockquote"]) {
      const rule = css.slice(css.indexOf(`${selector} {`));
      expect(
        rule.slice(0, rule.indexOf("}")),
        `${selector} lost the display stack`
      ).toContain("var(--font-display-stack)");
    }
  });
});

describe("vendored font wiring", () => {
  // The :root font stacks above consume --font-sans-latin, --font-mono-latin
  // and --font-display-latin (and their -ext siblings). Those custom
  // properties are only defined where next/font/local's generated class is
  // applied, so that class has to sit on <html>, the ancestor of :root.
  // Putting it on <body> instead leaves the properties undefined at :root,
  // and every stack above silently falls through to its system fallback
  // with no build or type error. See docs/plans/handoffs/faz-3.md.
  const documents = [
    "src/app/[lang]/layout.tsx",
    "src/app/global-not-found.tsx",
  ];

  it.each(documents)("puts fontVariables on <html> in %s", (path) => {
    const source = read(path);
    expect(source, path).toContain('import { fontVariables } from "@/fonts"');
    expect(source, path).toMatch(/<html\b[^>]*className=\{fontVariables\}/);
  });

  it.each(documents)("never leaves fontVariables on <body> in %s", (path) => {
    const source = read(path);
    expect(source, path).not.toMatch(/<body\b[^>]*fontVariables/);
  });
});

const EMERALD_RAMP_HEX = [
  "#ecfdf5",
  "#d1fae5",
  "#a7f3d0",
  "#6ee7b7",
  "#34d399",
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
  "#022c22",
];

describe("colour tokens", () => {
  it("does not ship a single Tailwind emerald ramp hex", () => {
    const lower = css.toLowerCase();
    for (const hex of EMERALD_RAMP_HEX) {
      expect(lower, `globals.css still contains ${hex}`).not.toContain(hex);
    }
  });

  it("dropped the hard coded emerald shadow on surface-panel", () => {
    expect(css.replace(/\s/g, "")).not.toContain("rgba(4,120,87");
  });

  it("no longer reuses the old shared emerald token value", () => {
    expect(css).not.toContain("oklch(0.516 0.114 157.2)");
  });

  it("keeps --primary and --muted-foreground on different values", () => {
    for (const block of ["light", "dark"] as const) {
      const source =
        block === "light"
          ? css.slice(css.indexOf(":root {"), css.indexOf(".dark {"))
          : css.slice(css.indexOf(".dark {"));
      const primary = source.match(/--primary:\s*([^;]+);/)?.[1]?.trim();
      const muted = source.match(/--muted-foreground:\s*([^;]+);/)?.[1]?.trim();

      expect(primary).toBeDefined();
      expect(muted).toBeDefined();
      expect(
        primary,
        `${block}: primary and muted-foreground collide`
      ).not.toBe(muted);
    }
  });

  it("ships one status token per theme, for the one status surface", () => {
    expect(css.match(/--status-up:/g)).toHaveLength(2);
    expect(css).toContain("--color-status-up: var(--status-up);");
    // --status-down was defined in both themes and mapped into the Tailwind
    // namespace for a live monitoring panel that was then decided against:
    // the Systems section renders build-time data and links out to Uptime
    // Kuma instead, so nothing on the site ever paints a failure state.
    expect(css).not.toContain("--status-down");
    expect(css).not.toContain("--color-status-down");
  });

  it("uses a solid focus ring colour, no alpha suffix", () => {
    const ringValues = [...css.matchAll(/--ring:\s*([^;]+);/g)].map(
      (m) => m[1]
    );
    expect(ringValues.length).toBeGreaterThanOrEqual(2);
    for (const value of ringValues) {
      expect(
        value,
        `--ring still carries an alpha channel: ${value}`
      ).not.toContain("/");
    }
  });
});

// The palette is written in oklch, so a contrast assertion has to convert it
// rather than trust a hex comment that can drift away from the token. The
// conversion used to be a second copy of the maths in tests/lib/contrast.ts,
// which no suite imported: two implementations of the same WCAG formula, one
// of them unreachable. This file is the consumer that helper was missing.
function tokenContrast(
  theme: "light" | "dark",
  foreground: string,
  background: string
) {
  return contrastRatio(
    relativeLuminance(readOklchToken(css, foreground, theme)),
    relativeLuminance(readOklchToken(css, background, theme))
  );
}

const themeBlocks = {
  light: css.slice(css.indexOf(":root {"), css.indexOf(".dark {")),
  dark: css.slice(css.indexOf(".dark {"), css.indexOf("@layer base")),
} as const;

const tokenValue = (block: string, name: string) => {
  const value = block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim();

  if (!value) throw new Error(`token ${name} is not defined in this block`);
  return value;
};

describe("control boundary contrast (WCAG 1.4.11)", () => {
  // Form fields and the outline button draw their own boundary, so the border
  // has to reach 3:1 against the surface behind it. --border stays where it
  // is: it only ever paints decorative hairlines.
  for (const theme of ["light", "dark"] as const) {
    it(`keeps --border-strong at 3:1 on the ${theme} background`, () => {
      const ratio = tokenContrast(theme, "border-strong", "background");
      expect(ratio, `${theme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        3
      );
    });

    it(`keeps --border-strong at 3:1 on the ${theme} card surface`, () => {
      const ratio = tokenContrast(theme, "border-strong", "card");
      expect(ratio, `${theme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        3
      );
    });

    it(`derives --input-border from --border-strong in ${theme}`, () => {
      expect(tokenValue(themeBlocks[theme], "--input-border")).toBe(
        "var(--border-strong)"
      );
    });
  }

  it("maps both boundary tokens into the Tailwind colour namespace", () => {
    expect(css).toContain("--color-border-strong: var(--border-strong);");
    expect(css).toContain("--color-input-border: var(--input-border);");
  });

  it("paints form controls and the outline button from them", () => {
    expect(read("src/components/ui/input.tsx")).toContain(
      "border-input-border"
    );
    expect(read("src/components/ui/textarea.tsx")).toContain(
      "border-input-border"
    );
    const button = read("src/components/ui/button.tsx");
    expect(button).toContain("border-border-strong");
    expect(button).not.toMatch(/outline:\s*\n?\s*"border border-border /);
  });

  // The header controls used to draw a full box border from the strong token.
  // Since 2026-09-02 they are flat (the owner found the pill and the circle
  // out of place next to the text nav): no box at all, and the one hairline
  // left, between TR and EN, still comes from the strong token so it clears
  // 3:1 like every other control boundary.
  const flatControls = [
    "src/components/layout/theme-toggle.tsx",
    "src/components/layout/language-switcher.tsx",
  ];

  it.each(flatControls)(
    "keeps %s flat and off the weak border token",
    (path) => {
      const source = read(path);
      expect(source).not.toMatch(/\bborder(-[trblxy])? border-/);
      expect(source).not.toMatch(
        /border-border(?!-strong)|border-border-strong\//
      );
      expect(source).not.toContain("rounded-full");
    }
  );

  it("draws the language hairline from the strong token", () => {
    expect(read("src/components/layout/language-switcher.tsx")).toContain(
      "bg-border-strong"
    );
  });
});

describe("stylesheet imports", () => {
  it("pulls in Tailwind and nothing else", () => {
    const imports = [...css.matchAll(/@import\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(imports).toEqual(["tailwindcss"]);
  });

  it("is scoped to src/ so class names quoted in docs and tests never compile", () => {
    // Tailwind 4.3 extracts candidates from every non-ignored file under the
    // project root. docs/plans quotes retired classes such as the emerald
    // shadow; scoping the scan keeps them out of the shipped CSS.
    expect(css).toMatch(/@import "tailwindcss" source\("\.\.\/"\);/);
  });
});

describe("cascade layers", () => {
  // Tailwind appends whatever a project writes in `@layer utilities` after its
  // own generated utilities. A class such as .content-entry then outranks a
  // same-specificity utility on the very same element, and overrides like
  // `lg:grid-cols-[...]` or `normal-case tracking-normal` compile but never
  // apply. The components layer sits below utilities, which is what every
  // call site assumes.
  it("declares component classes in the components layer, never utilities", () => {
    expect(cssRules).toContain("@layer components {");
    expect(cssRules).not.toContain("@layer utilities");
  });
});

describe("content entry affordances", () => {
  it("gives keyboard focus the same tint the pointer gets", () => {
    expect(css).toMatch(/\.content-entry:focus-within\s*\{[^}]*bg-accent/);
  });

  it("gates the hover tint behind a real hover device", () => {
    expect(css).toMatch(
      /@media \(hover: hover\) \{\s*\.content-entry:hover\s*\{/
    );
  });

  it("moves the arrow on focus-within as well as hover", () => {
    const rule = css.slice(css.indexOf(".entry-arrow {"));
    const body = rule.slice(0, rule.indexOf("}"));
    expect(body).toContain("sm:group-hover:opacity-100");
    expect(body).toContain("sm:group-focus-within:opacity-100");
    expect(body).toContain("sm:group-focus-within:text-primary");
  });
});

describe("small uppercase labels", () => {
  // 10px uppercase mono with 0.2em tracking is decoration, not a readable
  // date, reading time or skill group heading. 0.75rem is the floor and the
  // tracking comes down with it. Section level labels keep one step of size
  // and tracking above the floor, so the raise does not flatten every
  // uppercase label into the same rank.
  const informational = [
    ".eyebrow",
    ".meta-label",
    ".tag-pill",
    ".prose-content th",
  ];

  it.each(informational)("keeps %s at 0.75rem or larger", (selector) => {
    const rule = css.slice(css.indexOf(`${selector} {`));
    const body = rule.slice(0, rule.indexOf("}"));
    const size = body.match(/text-\[([\d.]+)rem\]/)?.[1];
    expect(size, `${selector} has no explicit rem size`).toBeDefined();
    expect(Number(size), `${selector} is ${size}rem`).toBeGreaterThanOrEqual(
      0.75
    );
    const tracking = body.match(/tracking-\[([\d.]+)em\]/)?.[1];
    expect(tracking, `${selector} has no explicit tracking`).toBeDefined();
    expect(
      Number(tracking),
      `${selector} tracks ${tracking}em`
    ).toBeLessThanOrEqual(0.12);
  });

  it("keeps section level labels a step above the inline meta labels", () => {
    const sizeOf = (selector: string) => {
      const rule = css.slice(css.indexOf(`${selector} {`));
      const body = rule.slice(0, rule.indexOf("}"));
      return Number(body.match(/text-\[([\d.]+)rem\]/)?.[1]);
    };
    for (const lead of [".eyebrow"]) {
      for (const inline of [".meta-label", ".tag-pill"]) {
        expect(
          sizeOf(lead),
          `${lead} does not outrank ${inline}`
        ).toBeGreaterThan(sizeOf(inline));
      }
    }
  });
});

describe("long form prose", () => {
  const styled = [
    ".prose-content h4",
    ".prose-content strong",
    ".prose-content blockquote",
    ".prose-content hr",
    ".prose-content kbd",
    ".prose-content table",
    ".prose-content th",
  ];

  it.each(styled)("styles %s", (selector) => {
    expect(css).toContain(`${selector} {`);
  });

  it("styles th and td together", () => {
    expect(css).toMatch(/\.prose-content th,\s*\n\s*\.prose-content td\s*\{/);
  });

  it("scrolls a wide table inside its wrapper instead of the page", () => {
    const rule = css.slice(css.indexOf(".table-wrap {"));
    expect(rule.slice(0, rule.indexOf("}"))).toContain("overflow-x-auto");
    // The minimum width is scoped to the wrapper, so an unwrapped table still
    // fits a 375px viewport instead of pushing the page sideways.
    expect(css).toMatch(/\.prose-content \.table-wrap > table\s*\{[^}]*min-w-/);
    const bare = css.slice(css.indexOf(".prose-content table {"));
    expect(bare.slice(0, bare.indexOf("}"))).not.toContain("min-w-");
    // Auto table layout still sizes to the sum of the cells' min-content
    // widths, so a long URL would widen an unwrapped table past the viewport
    // unless the cells are allowed to break anywhere.
    const cells = css.slice(css.indexOf(".prose-content th,"));
    expect(cells.slice(0, cells.indexOf("}"))).toContain(
      "overflow-wrap: anywhere"
    );
  });
});

describe("forced colours", () => {
  it("hides the decorative body layers and pins boundaries to CanvasText", () => {
    const block = css.slice(css.indexOf("@media (forced-colors: active)"));
    expect(block).toContain("body::before");
    expect(block).toContain("display: none");
    expect(block).toContain("border-color: CanvasText");
    expect(block).toContain("outline-color: Highlight");
  });

  it("restates the row hover cue as an outline as well as the focus cue", () => {
    expect(css).toMatch(
      /@media \(forced-colors: active\) and \(hover: hover\) \{\s*\.content-entry:hover\s*\{[^}]*outline:/
    );
  });

  it("keeps the block unlayered so it outranks every component class", () => {
    const index = css.indexOf("@media (forced-colors: active)");
    expect(index).toBeGreaterThan(-1);
    // Nothing between the last layer close and this block may open a layer.
    expect(css.slice(index)).not.toContain("@layer");
  });
});

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(full));
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
      out.push(full);
  }
  return out;
}

const sourceFiles = collectSourceFiles(join(process.cwd(), "src")).map(
  (file) => ({
    file,
    body: readFileSync(file, "utf8"),
  })
);

describe("component colour hygiene", () => {
  it("has no Tailwind emerald utility left in src", () => {
    const offenders = sourceFiles
      .filter(({ body }) => /\bemerald-/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("has no hard coded rgba() literal left in src", () => {
    const offenders = sourceFiles
      .filter(({ body }) => /rgba\(/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("ships no CSS gradient stand-in for a missing project cover", () => {
    const offenders = sourceFiles
      .filter(({ body }) => /radial-gradient/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

const NOT_OURS = new Set([
  "dark", // next-themes writes it on <html>
  "shiki", // emitted by the syntax highlighter
]);

const declared = new Set<string>();
for (const prelude of cssRules.split("{").slice(0, -1)) {
  const selector = prelude.slice(prelude.lastIndexOf("}") + 1);
  if (selector.trimStart().startsWith("@")) continue;
  for (const match of selector.matchAll(/\.([a-z][a-z0-9-]*)/g)) {
    const className = match[1];
    if (className && !NOT_OURS.has(className)) declared.add(className);
  }
}

describe("no dead classes in the shipped stylesheet", () => {
  // Every class globals.css defines has to reach the browser through some
  // call site, otherwise it is bytes on every page for nothing. This used to
  // be an existence assertion, which kept retired utilities alive instead of
  // catching them.
  //
  // It also used to carry a PENDING allowlist, holding .pull-quote as
  // "unused, wired up by the content branch". Three phases later no branch
  // had wired it up, so the rule was deleted and the allowlist with it: an
  // exemption that outlives the work it was waiting for is just a slower way
  // of shipping dead CSS.

  it("finds the classes it is supposed to check", () => {
    expect(declared.size).toBeGreaterThan(20);
    expect(declared.has("content-entry")).toBe(true);
  });

  it.each([...declared].sort())("uses .%s somewhere under src", (name) => {
    const used = sourceFiles.some(({ body }) =>
      new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(body)
    );
    expect(used, `.${name} is defined in globals.css but never used`).toBe(
      true
    );
  });
});

describe("no undefined project classes in src", () => {
  // The suite above only walks CSS -> source. The other direction was never
  // checked, so deleting .display-hero from the stylesheet while the class
  // was still printed on the home page h1 passed every gate: Tailwind
  // preflight makes an unstyled h1 inherit body size and weight, and nothing
  // failed. A project class name is one whose first segment matches a segment
  // the stylesheet itself owns, which keeps Tailwind utilities out without a
  // hand written prefix list.
  const projectPrefixes = new Set(
    [...declared].map((name) => name.split("-")[0])
  );
  // Strings that share a project prefix but are not class names.
  const NOT_CLASSES = new Set(["content-type", "content-length"]);

  const offenders = new Map<string, Set<string>>();
  for (const { file, body } of sourceFiles) {
    // Import specifiers are file paths, not class lists: "@/components/ui/page-header".
    const withoutImports = body.replace(
      /^\s*import[\s\S]*?from\s+"[^"]*";$/gm,
      ""
    );
    for (const literal of withoutImports.matchAll(
      /"([^"\n]*)"|`([^`]*)`|'([^'\n]*)'/g
    )) {
      const text = literal[1] ?? literal[2] ?? literal[3] ?? "";
      for (const token of text.matchAll(
        /(?<![\w-])[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?![\w-])/g
      )) {
        const name = token[0];
        const prefix = name.split("-")[0];
        if (!prefix || !projectPrefixes.has(prefix)) continue;
        if (declared.has(name) || NOT_CLASSES.has(name)) continue;
        const files = offenders.get(name) ?? new Set<string>();
        files.add(file);
        offenders.set(name, files);
      }
    }
  }

  it("scans the classes it is supposed to check", () => {
    expect(projectPrefixes.has("display")).toBe(true);
    expect(sourceFiles.length).toBeGreaterThan(20);
  });

  it("defines every project class a component prints", () => {
    const report = [...offenders]
      .sort()
      .map(([name, files]) => `.${name} (${[...files].sort().join(", ")})`);
    expect(
      report,
      "these class names reach the markup but globals.css defines no rule for them"
    ).toEqual([]);
  });
});

describe("project list layout", () => {
  it("adds a project list component with indexed editorial rows", () => {
    const path = "src/components/sections/project-list.tsx";
    expect(existsSync(repoPath(path))).toBe(true);
    const source = read(path);
    expect(source).toMatch(/export (async )?function ProjectList/);
    expect(source).toContain("content-stack");
    expect(source).toContain("content-entry");
    expect(source).toContain("after:absolute after:inset-0");
    expect(source).not.toContain("LazyMotion");
  });

  it("does not ship a card grid wrapper for project lists", () => {
    expect(
      existsSync(repoPath("src/components/sections/project-grid.tsx"))
    ).toBe(false);
    expect(
      existsSync(repoPath("src/components/sections/project-card.tsx"))
    ).toBe(false);
  });
});
