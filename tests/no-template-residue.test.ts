import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const TRACKED_PATHS = ["src", "content", "messages", "public", ".env.example"];

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

// These are matched as case insensitive substrings: they only ever appear as
// deliberate leftovers from the starter template, never as legitimate
// content, so a raw substring match is precise enough.
const FORBIDDEN_SUBSTRINGS = [
  "alex chen",
  "alex@example.com",
  "example.com",
  "techcorp",
  "startupxyz",
  "your name here",
];

// These are common English words that could plausibly appear inside real
// prose (a sentence ending in "tbd", a phrase like "coming soon" used
// unironically), so they are matched as whole words only.
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

function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files", ...TRACKED_PATHS], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean)
    .filter((file) => !BINARY_EXTENSIONS.some((ext) => file.endsWith(ext)))
    .filter((file) => !file.endsWith(".test.ts"));
}

function wordPattern(word: string): RegExp {
  return new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
}

describe("no template residue", () => {
  const files = trackedFiles();

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
      if (!file.startsWith("src/components/sections/")) return false;
      const source = readFileSync(file, "utf8");
      return (
        source.includes("radial-gradient") || source.includes("linear-gradient")
      );
    });
    expect(hits, `files with a gradient cover: ${hits.join(", ")}`).toEqual([]);
  });
});
