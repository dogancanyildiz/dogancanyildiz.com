import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

// docs/plans/ and docs/plans/handoffs/ are execution records written while
// dogancanyildiz.sh was still the primary domain; both carry an explicit
// historical-assumption note in their own README, so they keep the old
// direction on purpose. Every other document describes the current decision.
const HISTORICAL_TREES = ["docs/plans"];

// A line may still quote the old direction when it says so: the decision
// records keep the superseded text next to a "Karar değişikliği" marker.
const HISTORICAL_MARKER = /Karar değişikliği|tarihsel/i;

// The owner's 2026-08-27 decision: dogancanyildiz.com is primary and
// dogancanyildiz.sh only 301s to it. Anything describing the reverse hop is
// a leftover from the superseded decision.
const REVERSED_DIRECTION =
  /(dogancanyildiz)?\.com\s*(->|→)\s*(dogancanyildiz)?\.sh|com to sh/;

function markdownFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (HISTORICAL_TREES.includes(path)) continue;
      found.push(...markdownFiles(path));
    } else if (entry.name.endsWith(".md")) {
      found.push(path);
    }
  }
  return found;
}

describe("decision documents state the .sh -> .com redirect direction", () => {
  const files = markdownFiles("docs");

  it("finds the decision documents to check", () => {
    expect(files).toContain("docs/README.md");
    expect(files).toContain("docs/10-yol-haritasi.md");
    expect(files).toContain("docs/launch-checklist.md");
    expect(files.every((f) => !f.startsWith("docs/plans/"))).toBe(true);
  });

  it("never claims the reversed hop without marking it as superseded", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
      lines.forEach((line, index) => {
        if (!REVERSED_DIRECTION.test(line)) return;
        if (HISTORICAL_MARKER.test(line)) return;
        offenders.push(`${file}:${index + 1}: ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("the launch gate and its index row agree on the direction", () => {
    const checklist = readFileSync(
      join(ROOT, "docs/launch-checklist.md"),
      "utf8"
    );
    expect(checklist).toMatch(/dogancanyildiz\.sh -> dogancanyildiz\.com/);

    const indexRow = readFileSync(join(ROOT, "docs/README.md"), "utf8")
      .split("\n")
      .find((line) => line.includes("launch-checklist.md"));
    expect(indexRow).toBeDefined();
    expect(indexRow).toMatch(/\.sh -> \.com 301/);
  });

  it("the roadmap index and the Faz 1 record agree on the direction", () => {
    const roadmap = readFileSync(
      join(ROOT, "docs/10-yol-haritasi.md"),
      "utf8"
    );
    expect(roadmap).toMatch(
      /curl -I https:\/\/dogancanyildiz\.sh[^\n]*dogancanyildiz\.com/
    );
    expect(roadmap).toMatch(/Karar: `\.sh -> \.com` 301 Cloudflare Redirect Rule/);
  });
});

// Guards the exclusion above: if the historical tree ever loses its note the
// blanket skip stops being justified.
describe("the excluded plan tree says why it keeps the old direction", () => {
  it.each(["docs/plans/README.md", "docs/plans/handoffs/README.md"])(
    "%s marks its domain assumption as historical",
    (file) => {
      const doc = readFileSync(join(ROOT, file), "utf8");
      expect(doc).toMatch(/Domain varsayımı notu/);
      expect(doc).toMatch(/`\.com`|dogancanyildiz\.com/);
    }
  );
});
