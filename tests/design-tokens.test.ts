import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoPath = (relative: string) => join(process.cwd(), relative);
const read = (relative: string) => readFileSync(repoPath(relative), "utf8");

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

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

  it("uses Geist Sans for every heading level and the pull quote", () => {
    expect(css).toMatch(
      /h1,\s*\n\s*h2,\s*\n\s*h3,\s*\n\s*h4\s*\{[^}]*font-family:\s*var\(--font-sans-stack\)/
    );
    expect(css).toContain(".pull-quote");
    expect(css).toContain(".page-title");
    expect(css).toContain(".prose-measure");
    expect(css).toContain(".meta-label");
    expect(css).toContain(".info-tile");
    expect(css).toContain(".inset-panel");
    expect(css).toContain(".display-hero");
    expect(css).toContain(".display-section");
    expect(css).toContain(".section-label");
    expect(css).toContain(".section-space-lg");
    expect(css).toContain("max-w-6xl");
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
      const primary = source.match(/--primary:\s*([^;]+);/)?.[1].trim();
      const muted = source.match(/--muted-foreground:\s*([^;]+);/)?.[1].trim();
      expect(primary).toBeDefined();
      expect(muted).toBeDefined();
      expect(
        primary,
        `${block}: primary and muted-foreground collide`
      ).not.toBe(muted);
    }
  });

  it("exposes solid status tokens for the Faz 5 widget", () => {
    expect(css.match(/--status-up:/g)).toHaveLength(2);
    expect(css.match(/--status-down:/g)).toHaveLength(2);
    expect(css).toContain("--color-status-up: var(--status-up);");
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

function collectTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsxFiles(full));
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
      out.push(full);
  }
  return out;
}

const sourceFiles = collectTsxFiles(join(process.cwd(), "src")).map((file) => ({
  file,
  body: readFileSync(file, "utf8"),
}));

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

describe("panel shadow", () => {
  it("defines --shadow-color in both token blocks, black in dark mode", () => {
    const light = css.slice(css.indexOf(":root {"), css.indexOf(".dark {"));
    const dark = css.slice(css.indexOf(".dark {"));
    expect(light).toMatch(/--shadow-color:\s*oklch\(/);
    expect(dark).toMatch(/--shadow-color:\s*oklch\(0 0 0\)/);
  });
});

describe("tailwind source scanning", () => {
  it("is scoped to src/ so class names quoted in docs and tests never compile", () => {
    // Tailwind 4.3 extracts candidates from every non-ignored file under the
    // project root. docs/plans quotes retired classes such as the emerald
    // shadow; scoping the scan keeps them out of the shipped CSS.
    expect(css).toMatch(/@import "tailwindcss" source\("\.\.\/"\);/);
  });
});
