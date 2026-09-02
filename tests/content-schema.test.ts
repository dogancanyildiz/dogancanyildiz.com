import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readingMetadata } from "../velite.config";

// The real velite binary, not "npx velite": npx re-resolves and can fall
// back to a network install when the local bin is not on PATH, which turns
// this test flaky and slow for no reason, since the package is already an
// installed dependency.
const veliteBin = fileURLToPath(
  new URL("../node_modules/.bin/velite", import.meta.url)
);

function runVelite(configPath: string): { status: number; output: string } {
  try {
    const output = execFileSync(
      veliteBin,
      ["build", "--config", configPath, "--clean", "--strict"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    return { status: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

describe("velite content schema", () => {
  it("rejects a project with an invalid slug and missing required fields", () => {
    const result = runVelite("tests/fixtures/velite.invalid.config.ts");
    expect(result.status).not.toBe(0);
    expect(result.output).toMatch(/broken\.mdx/);
  }, 60_000);

  // "accepts the real content collections" used to run velite against the
  // real content a second time here. `npm run build:content` and the CI
  // build already run and assert on that (any schema violation fails the
  // build), so this test only duplicated that coverage at 60s of cost.
  // s.string().url() accepts javascript: and data: as happily as https, and
  // links.live goes straight into an href. The repo is public and takes
  // content pull requests, so the schema is the gate that has to hold.
  it("rejects a javascript: url in links.live", () => {
    const result = runVelite("tests/fixtures/velite.invalid-links.config.ts");
    expect(result.status).not.toBe(0);
    expect(result.output).toMatch(/bad-link\.mdx/);
    expect(result.output).toMatch(/links\.live/);
    expect(result.output).toMatch(/https:\/\//);
  }, 60_000);

  // updated, coverAlt and draft-on-a-project were added by the audit. The
  // Köklü Hukuk case study now uses cover and coverAlt, but updated and a
  // drafted project still have no real file behind them, and none of the
  // three had ever been compiled when this fixture was written. It puts all
  // of them through the real pipeline so a wrong type fails here rather than
  // on the day an author first reaches for one.
  it("compiles the optional frontmatter fields, including the unused ones", () => {
    const result = runVelite("tests/fixtures/velite.schema-fields.config.ts");
    expect(result.status, result.output).toBe(0);

    const readFirst = (name: string): Record<string, unknown> => {
      const entries = JSON.parse(
        readFileSync(
          join(process.cwd(), "tests/fixtures/.velite-schema-fields", name),
          "utf8"
        )
      ) as Array<Record<string, unknown>>;
      const [first] = entries;
      if (!first) {
        throw new Error(`${name} collected no entries`);
      }
      return first;
    };

    const project = readFirst("projects.json");
    const post = readFirst("posts.json");

    expect(project.draft).toBe(true);
    expect(project.coverAlt).toBe(
      "A wide screenshot of the dashboard, three cards over a dark background."
    );
    expect(post.draft).toBe(true);
    expect(post.coverAlt).toBe("A photo of the rack the site runs on.");

    // s.isodate() normalizes to the same shape date already had, which is what
    // src/app/sitemap.ts feeds to new Date() for lastmod and what the
    // BlogPosting schema publishes as dateModified.
    for (const value of [project.updated, post.updated]) {
      expect(typeof value).toBe("string");
      expect(new Date(value as string).toISOString().slice(0, 10)).toBe(
        "2026-08-27"
      );
    }
    // The two dates stay independent: dateModified falling back to date is a
    // decision made in the schema builder, not something the parser blurs.
    expect(String(post.date).slice(0, 10)).toBe("2026-08-01");
  }, 60_000);
});

describe("reading metadata", () => {
  it("counts a Turkish word as one word", () => {
    // velite's own s.metadata() matches /[a-zA-Z]+/, so "Türkiye" counted as
    // "T" plus "rkiye" and the Turkish posts came out 40 to 47 percent longer
    // than they are, in the reading time and in the BlogPosting wordCount.
    expect(readingMetadata("Türkiye'de ağır işler").wordCount).toBe(3);
    expect(readingMetadata("İstanbul'da sunucu çöktü").wordCount).toBe(3);
    expect(readingMetadata("one two three").wordCount).toBe(3);
  });

  it("keeps a hyphenated or apostrophed word whole", () => {
    expect(readingMetadata("self-hosting").wordCount).toBe(1);
    expect(readingMetadata("don't").wordCount).toBe(1);
  });

  it("never reports less than a minute", () => {
    expect(readingMetadata("").readingTime).toBe(1);
    expect(readingMetadata("tek kelime").readingTime).toBe(1);
  });

  it("rounds a long body to the nearest minute", () => {
    const words = Array.from({ length: 800 }, () => "kelime").join(" ");
    expect(readingMetadata(words).wordCount).toBe(800);
    expect(readingMetadata(words).readingTime).toBe(3);
  });

  it("matches the counts the build wrote for the real posts", () => {
    const posts = JSON.parse(
      readFileSync(join(process.cwd(), ".velite/posts.json"), "utf8")
    ) as { locale: string; slug: string; metadata: { wordCount: number } }[];

    const pairs = new Map<string, Record<string, number>>();
    for (const post of posts) {
      expect(
        post.metadata.wordCount,
        `${post.locale}/${post.slug}`
      ).toBeGreaterThan(0);
      const entry = pairs.get(post.slug) ?? {};
      entry[post.locale] = post.metadata.wordCount;
      pairs.set(post.slug, entry);
    }

    for (const [slug, counts] of pairs) {
      if (counts.en === undefined || counts.tr === undefined) continue;
      // Turkish says the same thing in fewer words here, so the translation is
      // the shorter one. The ASCII word split made it the longer one every
      // time, which is what gave the inflated reading time away.
      expect(counts.tr, slug).toBeLessThan(counts.en);
    }
  });
});
