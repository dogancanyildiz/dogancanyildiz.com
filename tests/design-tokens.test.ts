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
