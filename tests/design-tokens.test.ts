import { readFileSync } from "node:fs";
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
    expect(css).toMatch(
      /--font-display-stack:\s*var\(--font-display-latin\),\s*var\(--font-display-ext\)/
    );
  });

  it("reserves the serif display face for h1 and the pull quote", () => {
    expect(css).toMatch(
      /h1\s*\{[^}]*font-family:\s*var\(--font-display-stack\)/
    );
    expect(css).toMatch(
      /h2,\s*\n\s*h3,\s*\n\s*h4\s*\{[^}]*font-family:\s*var\(--font-sans-stack\)/
    );
    expect(css).toContain(".pull-quote");
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
