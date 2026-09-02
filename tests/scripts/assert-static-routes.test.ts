import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { describe, expect, it } from "vitest";
import { pathnames, routing } from "@/i18n/routing";
// The script exports its route derivation and only runs the check when node
// invokes it directly, so importing it here does not read a build manifest.
import {
  LOCALE_PAGES,
  readLocales,
  requiredRoutes,
} from "../../scripts/assert-static-routes.mjs";

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

  it("reads its locale list out of the routing config", async () => {
    // The list used to be hand written here, so adding a locale to
    // routing.ts left this check verifying half the site while still
    // reporting a pass.
    expect(await readLocales()).toEqual([...routing.locales]);
  });

  it("requires every locale for every top level content route", async () => {
    const required = requiredRoutes(await readLocales());

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
      "/en/privacy",
      "/tr/privacy",
      "/en/coming-soon",
      "/tr/coming-soon",
      "/en/updating",
      "/tr/updating",
      "/en/feed.xml",
      "/tr/feed.xml",
    ]) {
      expect(required).toContain(route);
    }
  });

  it("grows the required list with the locale list", () => {
    expect(requiredRoutes(["en", "tr", "de"])).toContain("/de/about");
    expect(requiredRoutes(["en"])).not.toContain("/tr/about");
  });

  it("requires the root level static metadata routes", () => {
    const required = requiredRoutes(["en"]);
    for (const route of [
      "/robots.txt",
      "/sitemap.xml",
      "/icon",
      "/apple-icon",
    ]) {
      expect(required).toContain(route);
    }
  });

  it("covers every public page of the routing config", async () => {
    // A page added to routing.ts and forgotten here would never be checked
    // for being prerendered in both locales.
    const dynamic = ["/projects/[slug]", "/blog/[slug]"];
    const expected = Object.keys(pathnames)
      .filter((pathname) => !dynamic.includes(pathname))
      .map((pathname) => (pathname === "/" ? "" : pathname))
      .sort();

    expect([...LOCALE_PAGES].sort()).toEqual(expected);
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
