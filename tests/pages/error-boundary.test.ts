import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

/**
 * Comments are stripped before the code assertions below, because both files
 * explain in prose why they use one prop and not the other, and a test that
 * matched the explanation would pass on a file that had changed its mind.
 */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const LOCALE_ERROR = "src/app/[lang]/error.tsx";
const GLOBAL_ERROR = "src/app/global-error.tsx";

/**
 * The error boundaries have no render assertions here on purpose: they are
 * client components, and what actually broke them in review was never the
 * markup. It was the contract around them, which is invisible until a real
 * error hits production: a boundary that is not a client module, a global
 * boundary that lost its own html/body (it replaces the root layout, so
 * nothing else emits one), or a retry button wired to the prop Next used to
 * pass. `reset` still type checks as a prop name; it just never arrives, so
 * the button becomes a no-op on the one screen a visitor sees after a crash.
 */
describe("error boundaries", () => {
  it.each([LOCALE_ERROR, GLOBAL_ERROR])("%s is a client module", (relative) => {
    const source = read(relative);
    const firstStatement = source
      .split("\n")
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !line.startsWith("//") &&
          !line.startsWith("/*") &&
          !line.startsWith("*")
      );

    expect(firstStatement).toBe('"use client";');
  });

  it("takes the retry prop Next 16 passes, not the removed reset", () => {
    const source = stripComments(read(LOCALE_ERROR));

    expect(source).toMatch(/\bretry\b/);
    expect(source).toContain("retry()");
    expect(source).not.toMatch(/\breset\b/);
  });

  it("renders the locale boundary through the shared shell and translations", () => {
    const source = read(LOCALE_ERROR);

    expect(source).toContain('useTranslations("errorPage")');
    expect(source).toContain("error.digest");
  });

  it("keeps the global boundary self contained, because it replaces the root layout", () => {
    const source = stripComments(read(GLOBAL_ERROR));

    // No other document element is rendered when this file takes over, so it
    // has to bring the html element, the body, the stylesheet and the fonts.
    expect(source).toContain("<html");
    expect(source).toContain("<body");
    expect(source).toContain('import "./globals.css"');
    expect(source).toContain("fontVariables");
    expect(source).toMatch(/\bretry\b/);
    // next-intl needs a request locale, which is exactly what has failed by
    // the time this file renders.
    expect(source).not.toContain("next-intl");
  });
});

describe("errorPage messages", () => {
  const KEYS = ["title", "description", "retry", "backHome", "digestLabel"];

  it.each([
    ["en", en],
    ["tr", tr],
  ])("%s carries every key the boundary reads", (_locale, messages) => {
    const namespace = (messages as { errorPage?: Record<string, string> })
      .errorPage;

    expect(namespace).toBeDefined();
    expect(Object.keys(namespace ?? {}).sort()).toEqual([...KEYS].sort());
    for (const key of KEYS) {
      expect(namespace?.[key]?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });
});
