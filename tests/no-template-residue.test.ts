import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCAN_ROOTS = ["src", "content", "messages", "public", ".env.example"];

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".velite",
  ".git",
  "coverage",
]);

const BINARY_EXTENSIONS = [
  ".ico",
  ".woff",
  ".woff2",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
];

const FORBIDDEN_SUBSTRINGS = [
  "alex chen",
  "alex@example.com",
  "example.com",
  "techcorp",
  "startupxyz",
  "your name here",
];

const FORBIDDEN_WORDS = ["tbd", "lorem ipsum", "coming soon"];

const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "em dash or en dash", pattern: /[\u2013\u2014]/ },
  {
    label: "bracketed placeholder",
    pattern: /\[(Etkinlik|Konu|Tarih|Şehir|TODO)[^\]]*\]/,
  },
  {
    label: "placeholder social root link",
    pattern: /https:\/\/(github|linkedin|twitter)\.com\/?["']/,
  },
];

function shouldScanFile(file: string): boolean {
  if (!existsSync(file)) return false;
  if (BINARY_EXTENSIONS.some((ext) => file.endsWith(ext))) return false;
  if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return false;
  return true;
}

function collectFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  const stats = statSync(root);
  if (stats.isFile()) {
    return shouldScanFile(root) ? [root] : [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const entryStats = statSync(full);
    if (entryStats.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) continue;
      files.push(...collectFiles(full));
      continue;
    }
    if (shouldScanFile(full)) {
      files.push(full);
    }
  }
  return files;
}

function scannedFiles(): string[] {
  return SCAN_ROOTS.flatMap((root) => collectFiles(root));
}

function wordPattern(word: string): RegExp {
  return new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
}

describe("no template residue", () => {
  const files = scannedFiles();

  it("tracks a non trivial set of content files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(FORBIDDEN_SUBSTRINGS)("does not contain %s anywhere", (needle) => {
    const hits = files.filter((file) =>
      readFileSync(file, "utf8").toLowerCase().includes(needle)
    );
    expect(hits, `files containing "${needle}": ${hits.join(", ")}`).toEqual(
      []
    );
  });

  it.each(FORBIDDEN_WORDS)(
    "does not contain the whole word %s anywhere",
    (word) => {
      const pattern = wordPattern(word);
      const hits = files.filter((file) =>
        pattern.test(readFileSync(file, "utf8"))
      );
      expect(hits, `files containing "${word}": ${hits.join(", ")}`).toEqual(
        []
      );
    }
  );

  it.each(FORBIDDEN_PATTERNS)(
    "does not contain $label",
    ({ label, pattern }) => {
      const hits = files.filter((file) =>
        pattern.test(readFileSync(file, "utf8"))
      );
      expect(hits, `files containing ${label}: ${hits.join(", ")}`).toEqual([]);
    }
  );

  it("does not use a css gradient as a project cover", () => {
    const hits = files.filter((file) => {
      if (!file.includes("src/components/sections/")) return false;
      const source = readFileSync(file, "utf8");
      return (
        source.includes("radial-gradient") || source.includes("linear-gradient")
      );
    });
    expect(hits, `files with a gradient cover: ${hits.join(", ")}`).toEqual([]);
  });
});
