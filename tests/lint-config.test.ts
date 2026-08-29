import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const root = process.cwd();

/**
 * The resolved config ESLint would apply to one file, which is what actually
 * governs a run. Asserting on it rather than on the text of eslint.config.mjs
 * keeps the guard honest when eslint-config-next changes its own defaults.
 */
async function configFor(file: string): Promise<{
  rules?: Record<string, unknown>;
  languageOptions?: { parserOptions?: Record<string, unknown> };
}> {
  const eslint = new ESLint({ cwd: root });
  return eslint.calculateConfigForFile(join(root, file));
}

const severity = (rules: Record<string, unknown> | undefined, name: string) => {
  const entry = rules?.[name];
  return Array.isArray(entry) ? entry[0] : entry;
};

describe("lint script", () => {
  it("fails the run on warnings, so a warning cannot ride into main", () => {
    const pkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8")
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts.lint).toContain("--max-warnings=0");
  });
});

describe("eslint config", () => {
  it("type checks TypeScript sources through the project service", async () => {
    const config = await configFor("src/components/sections/contact-form.tsx");
    expect(config.languageOptions?.parserOptions?.projectService).toBe(true);
  });

  it("errors on the promise misuse a type aware run can see", async () => {
    const { rules } = await configFor("src/lib/content.ts");
    for (const rule of [
      "@typescript-eslint/await-thenable",
      "@typescript-eslint/no-floating-promises",
      "@typescript-eslint/no-misused-promises",
      "@typescript-eslint/no-unnecessary-type-assertion",
    ]) {
      expect(severity(rules, rule)).toBe(2);
    }
  });

  it("leaves the .mjs scripts out of the type aware set", async () => {
    // scripts/*.mjs carry no type information; the project service would
    // fail to place them in a program.
    const config = await configFor("scripts/verify-docs.mjs");
    expect(
      config.languageOptions?.parserOptions?.projectService
    ).toBeUndefined();
    expect(
      severity(config.rules, "@typescript-eslint/no-floating-promises")
    ).not.toBe(2);
  });

  it("re-enables the target=_blank guard eslint-config-next turns off", async () => {
    const { rules } = await configFor("src/components/layout/footer.tsx");
    expect(severity(rules, "react/jsx-no-target-blank")).toBe(2);
  });

  it("treats the accessibility rules as errors, not advice", async () => {
    const { rules } = await configFor("src/components/layout/footer.tsx");
    for (const rule of [
      "jsx-a11y/alt-text",
      "jsx-a11y/aria-props",
      "jsx-a11y/aria-proptypes",
      "jsx-a11y/aria-unsupported-elements",
      "jsx-a11y/role-has-required-aria-props",
      "jsx-a11y/role-supports-aria-props",
    ]) {
      expect(severity(rules, rule)).toBe(2);
    }
  });
});
