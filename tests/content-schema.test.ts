import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

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
});
