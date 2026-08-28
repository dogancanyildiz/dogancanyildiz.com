import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

function runVelite(configPath: string): { status: number; output: string } {
  try {
    const output = execFileSync(
      "npx",
      ["velite", "build", "--config", configPath, "--clean", "--strict"],
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

  it("accepts the real content collections", () => {
    const result = runVelite("tests/fixtures/velite.valid.config.ts");
    expect(result.status).toBe(0);
  }, 60_000);

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

  // updated, coverAlt and draft-on-a-project were added by the audit and no
  // real content file sets any of them yet, so nothing ever compiled them: a
  // wrong type would have surfaced on the day an author first used one. This
  // fixture puts all three through the real pipeline.
  it("compiles the optional frontmatter fields no content file uses yet", () => {
    const result = runVelite("tests/fixtures/velite.schema-fields.config.ts");
    expect(result.status, result.output).toBe(0);

    const read = (name: string) =>
      JSON.parse(
        readFileSync(
          join(process.cwd(), "tests/fixtures/.velite-schema-fields", name),
          "utf8"
        )
      ) as Array<Record<string, unknown>>;

    const [project] = read("projects.json");
    const [post] = read("posts.json");

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
