import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { describe, expect, it } from "vitest";

const scriptPath = join(process.cwd(), "scripts/assert-static-routes.mjs");
const script = () => readFileSync(scriptPath, "utf8");

describe("scripts/assert-static-routes.mjs", () => {
  it("matches the repository prettier style", async () => {
    // Regression guard: this file was authored wider than the repo's
    // printWidth (80) and broke `npm run format`. scripts/ is not in
    // .prettierignore, so every script here must stay check-clean.
    const config = await prettier.resolveConfig(scriptPath);
    const formatted = await prettier.check(script(), {
      ...config,
      filepath: scriptPath,
    });
    expect(formatted).toBe(true);
  });

  it("reads the prerender manifest instead of parsing build text output", () => {
    const content = script();
    expect(content).toContain("prerender-manifest.json");
    expect(content).toContain("readFile");
  });

  it("requires both locales for every top level content route", () => {
    const content = script();
    for (const route of [
      "/en",
      "/tr",
      "/en/about",
      "/tr/about",
      "/en/projects",
      "/tr/projects",
      "/en/blog",
      "/tr/blog",
      "/en/contact",
      "/tr/contact",
    ]) {
      expect(content).toContain(`"${route}"`);
    }
  });

  it("fails the check when api routes are prerendered", () => {
    const content = script();
    expect(content).toContain("apiRoutes.length > 0");
    expect(content).toContain("api routes must stay dynamic");
  });

  it("exits non zero when the manifest is missing or a check fails", () => {
    const matches = script().match(/process\.exit\(1\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
