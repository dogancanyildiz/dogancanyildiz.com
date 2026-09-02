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

/**
 * Translates one .dockerignore pattern into a regular expression that matches
 * a whole slash separated path, following the same rules the daemon's pattern
 * matcher uses:
 *
 * - a pattern is matched against the entire relative path, not against each
 *   path segment, so a slash free pattern such as ".velite-*" is anchored at
 *   the context root and never reaches a nested directory,
 * - "**" matches any number of path segments (including none),
 * - "*" and "?" match within a single segment only.
 */
function patternToRegExp(pattern: string): RegExp {
  const segments = pattern.split("/");
  const parts = segments.map((segment) => {
    if (segment === "**") return "(?:[^/]+/)*[^/]+";
    return segment
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/[*?]/g, (c) => (c === "*" ? "[^/]*" : "[^/]"));
  });

  // "**/" may also match zero segments, so "**/x" has to match a bare "x".
  const body = parts.reduce((acc, part, index) => {
    if (index === 0) return part;
    if (segments[index - 1] === "**") return `${acc}(?:/${part})|${part}`;
    return `${acc}/${part}`;
  }, "");

  return new RegExp(`^(?:${body})$`);
}

/**
 * True when the daemon would leave `path` out of the build context. A path is
 * excluded when it matches a pattern itself or lives under a directory that
 * does, and the last matching pattern wins so a "!" exception can bring a
 * file back.
 */
function isExcluded(patterns: string[], path: string): boolean {
  const ancestors = path
    .split("/")
    .map((_, index, all) => all.slice(0, index + 1).join("/"));

  let excluded = false;
  for (const pattern of patterns) {
    const negated = pattern.startsWith("!");
    const regexp = patternToRegExp(negated ? pattern.slice(1) : pattern);
    if (ancestors.some((candidate) => regexp.test(candidate))) {
      excluded = !negated;
    }
  }
  return excluded;
}

describe(".dockerignore pattern semantics", () => {
  // Sanity checks for the matcher above, taken from a real "docker build" over
  // a throwaway context: without them a bug in the helper could turn every
  // expectation in this file green.
  it("anchors a slash free pattern at the context root", () => {
    expect(isExcluded([".velite-*"], ".velite-cache/marker.txt")).toBe(true);
    expect(
      isExcluded([".velite-*"], "tests/fixtures/.velite-invalid/marker.txt")
    ).toBe(false);
  });

  it("lets a ** prefix reach both the root and any nested directory", () => {
    expect(isExcluded(["**/.velite-*"], ".velite-cache/marker.txt")).toBe(true);
    expect(
      isExcluded(["**/.velite-*"], "tests/fixtures/.velite-invalid/marker.txt")
    ).toBe(true);
  });

  it("honours a later negation", () => {
    expect(isExcluded(["*.md", "!README.md"], "README.md")).toBe(false);
    expect(isExcluded(["*.md", "!README.md"], "CHANGELOG.md")).toBe(true);
  });
});

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
    "audit",
    ".cursor",
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

  // T-15: a fixture that vendors its own node_modules, and velite's alternate
  // output directories used by the content fixtures, are build context noise
  // the production image never needs. These are asserted by path rather than
  // by pattern text: the first attempt at this shipped a bare ".velite-*",
  // which is root anchored and therefore excluded nothing that exists, while
  // a "toContain" assertion on the pattern string still reported green.
  const excludedFixturePaths = [
    "tests/fixtures/node_modules/some-package/index.js",
    "tests/fixtures/.velite-invalid/index.json",
    "tests/fixtures/.velite-invalid-links/index.json",
    "tests/fixtures/.velite-schema-fields/index.json",
    ".velite/index.json",
  ];

  it.each(excludedFixturePaths)("keeps %s out of the build context", (path) => {
    expect(isExcluded(readPatterns(), path)).toBe(true);
  });

  it("still ships the content Velite compiles inside the image", () => {
    const patterns = readPatterns();
    expect(isExcluded(patterns, "content/blog/tr/post.mdx")).toBe(false);
    expect(isExcluded(patterns, "content/projects/en/project.md")).toBe(false);
    expect(isExcluded(patterns, "src/app/layout.tsx")).toBe(false);
    expect(isExcluded(patterns, "README.md")).toBe(false);
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
