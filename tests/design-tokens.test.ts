import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
