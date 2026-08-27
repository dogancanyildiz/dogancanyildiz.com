import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { describe, expect, it } from "vitest";

const scriptPath = join(process.cwd(), "scripts/audit-live-links.mjs");
const script = () => readFileSync(scriptPath, "utf8");

describe("scripts/audit-live-links.mjs", () => {
  it("matches the repository prettier style", async () => {
    const config = await prettier.resolveConfig(scriptPath);
    const formatted = await prettier.check(script(), {
      ...config,
      filepath: scriptPath,
    });
    expect(formatted).toBe(true);
  });

  it("reads velite project output for live demo URLs", () => {
    expect(script()).toContain("projects.json");
    expect(script()).toContain("build:content");
  });

  it("audits certificate verify URLs when present in profile data", () => {
    expect(script()).toContain("verifyUrl");
    expect(script()).toContain("profile.ts");
  });

  it("exits non zero when a URL check fails", () => {
    expect(script()).toContain("process.exit(1)");
  });
});
