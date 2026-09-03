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

  it("checks the domain scope and the deploy checklists", () => {
    const content = script();
    expect(content).toContain("OUT_OF_SCOPE_DOMAIN");
    expect(content).toContain("coolify-kurulum.md");
    expect(content).toContain("traefik-ve-origin.md");
  });

  it("still guards the apex to www direction after the second domain left", () => {
    // The .sh checks were the bulk of the domain section. Dropping them must
    // not take the canonical host guard with them: nothing in the app can
    // observe the apex hop, so the Cloudflare checklist is the only record.
    const content = script();
    expect(content).toContain("apex to www");
    expect(content).not.toContain("REVERSED_DIRECTION");
  });

  it("guards the locale scheme against the pre-2026-08-30 English-at-root wording", () => {
    const content = script();
    expect(content).toContain("STALE_LOCALE_SCHEME");
    expect(content).toContain("checkLocaleScheme");
    // Same exception the domain check reuses: a marked historical note, or
    // docs/plans/**, is allowed to still describe the old scheme.
    expect(content).toContain("HISTORICAL_MARKER");
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
