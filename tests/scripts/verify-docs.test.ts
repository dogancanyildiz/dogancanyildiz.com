import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { describe, expect, it } from "vitest";

const scriptPath = join(process.cwd(), "scripts/verify-docs.mjs");
const script = () => readFileSync(scriptPath, "utf8");

describe("scripts/verify-docs.mjs", () => {
  it("matches the repository prettier style", async () => {
    const config = await prettier.resolveConfig(scriptPath);
    const formatted = await prettier.check(script(), {
      ...config,
      filepath: scriptPath,
    });
    expect(formatted).toBe(true);
  });

  it("checks the domain redirect direction and the deploy checklists", () => {
    const content = script();
    expect(content).toContain("REVERSED_DIRECTION");
    expect(content).toContain("coolify-kurulum.md");
    expect(content).toContain("traefik-ve-origin.md");
  });

  it("exits non zero and lists every problem when a check fails", () => {
    const content = script();
    expect(content).toContain("process.exit(1)");
    expect(content).toContain("Doc verification failed:");
  });

  it("passes against the repository's actual docs", () => {
    // Runs the real script against the real docs/ tree, the same way
    // `npm run verify:docs` does, so a doc that drifts from the behaviour it
    // describes fails here too instead of only showing up in CI.
    const output = execFileSync("node", [scriptPath], { encoding: "utf8" });
    expect(output).toMatch(
      /^Doc verification passed \(\d+ files scanned\)\.$/m
    );
  });
});
