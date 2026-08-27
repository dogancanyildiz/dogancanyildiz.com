import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOCKERIGNORE_PATH = join(process.cwd(), ".dockerignore");

function readPatterns(): string[] {
  return readFileSync(DOCKERIGNORE_PATH, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

describe(".dockerignore", () => {
  const required = [
    "node_modules",
    ".next",
    ".git",
    ".github",
    ".claude",
    ".local",
    ".nodeterm",
    ".superpowers",
    ".env",
    ".env.*",
    "docs",
    "*.md",
    "!README.md",
    "docker-compose.yml",
    "tsconfig.tsbuildinfo",
  ];

  it.each(required)("excludes %s from the build context", (pattern) => {
    expect(readPatterns()).toContain(pattern);
  });

  it("never excludes markdown files below the repository root", () => {
    // Velite (Faz 4) reads content/**/*.md and content/**/*.mdx from the build
    // context. A recursive "**/*.md" pattern here would silently produce an
    // empty content collection inside the image.
    expect(readPatterns()).not.toContain("**/*.md");
    expect(readPatterns()).not.toContain("**/*.mdx");
  });

  it("does not exclude the Dockerfile itself", () => {
    expect(readPatterns()).not.toContain("Dockerfile");
  });
});
