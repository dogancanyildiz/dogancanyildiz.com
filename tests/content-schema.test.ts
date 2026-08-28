import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
});
