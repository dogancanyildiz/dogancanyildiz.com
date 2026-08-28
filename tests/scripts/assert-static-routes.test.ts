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
      "/en/feed.xml",
      "/tr/feed.xml",
    ]) {
      expect(content).toContain(`"${route}"`);
    }
  });

  it("requires the root level static metadata routes", () => {
    const content = script();
    for (const route of [
      "/robots.txt",
      "/sitemap.xml",
      "/icon",
      "/apple-icon",
    ]) {
      expect(content).toContain(`"${route}"`);
    }
  });

  it("documents why opengraph-image is not in the required list", () => {
    expect(script()).toContain("opengraph-image is intentionally excluded");
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

  it("reads the velite content output instead of trusting a route count", () => {
    const content = script();
    expect(content).toContain("posts.json");
    expect(content).toContain("projects.json");
    expect(content).toContain("build:content");
  });

  it("compares prerendered project and blog routes to content slugs per locale", () => {
    const content = script();
    // Regression guard: the old rule only compared en vs tr counts, so a
    // route with the wrong slug (built from the wrong content entry) still
    // passed as long as the totals matched. This now has to fail.
    expect(content).not.toContain("project detail count differs");
    expect(content).toContain("project routes do not match content slugs");
    expect(content).toContain("blog routes do not match content slugs");
  });
});
