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

  // Deliberately not running the script against the real docs/ tree here:
  // the script's own header comment states the point of moving these checks
  // out of vitest was that "a doc going stale is not the kind of failure a
  // developer needs surfaced on every `npm run test` inner loop". Executing
  // it in this suite would recreate exactly that coupling. The CI "Verify
  // docs" step (`npm run verify:docs`) still runs it for real on every push
  // and pull request.
});
