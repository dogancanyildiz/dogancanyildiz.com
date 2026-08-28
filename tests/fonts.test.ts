import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const VENDORED_WOFF2 = [
  "src/fonts/geist-latin.woff2",
  "src/fonts/geist-latin-ext.woff2",
  "src/fonts/geist-mono-latin.woff2",
  "src/fonts/geist-mono-latin-ext.woff2",
  "src/fonts/instrument-serif-latin.woff2",
  "src/fonts/instrument-serif-latin-ext.woff2",
];

const VENDORED_OG_WOFF = [
  "public/fonts/og/geist-latin.woff",
  "public/fonts/og/geist-latin-ext.woff",
  "public/fonts/og/geist-mono-latin.woff",
];

describe("vendored fonts", () => {
  it.each(VENDORED_WOFF2)("%s exists and is a real woff2 file", (relative) => {
    const file = join(root, relative);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(5000);
    // woff2 magic number: "wOF2"
    expect(readFileSync(file).subarray(0, 4).toString("latin1")).toBe("wOF2");
  });

  it.each(VENDORED_OG_WOFF)("%s exists and is a real woff file", (relative) => {
    const file = join(root, relative);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(5000);
    // woff magic number: "wOFF"
    expect(readFileSync(file).subarray(0, 4).toString("latin1")).toBe("wOFF");
  });

  it("ships the OFL licence next to the vendored files", () => {
    for (const name of [
      "LICENSE-geist.txt",
      "LICENSE-geist-mono.txt",
      "LICENSE-instrument-serif.txt",
    ]) {
      expect(existsSync(join(root, "src", "fonts", name))).toBe(true);
    }
  });

  it("declares one unicode-range per subset", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    expect(source).toContain("U+0100-02BA");
    expect(source).toContain("U+0131");
    expect(source.match(/prop: "unicode-range"/g)).toHaveLength(6);
    for (const variable of [
      "--font-sans-latin",
      "--font-sans-ext",
      "--font-mono-latin",
      "--font-mono-ext",
      "--font-display-latin",
      "--font-display-ext",
    ]) {
      expect(source).toContain(variable);
    }
  });

  it("keeps the metric fallback off every latin face", () => {
    // The generated fallback face has no unicode-range, so on a latin face it
    // would render the Turkish glyphs in Arial and the latin-ext file would
    // never be reached.
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    const fallbackFor = (variable: string) => {
      const block = source.slice(source.indexOf(`variable: "${variable}"`));
      return block.match(/adjustFontFallback: (false|"[^"]+")/)?.[1];
    };
    expect(fallbackFor("--font-sans-latin")).toBe("false");
    expect(fallbackFor("--font-mono-latin")).toBe("false");
    expect(fallbackFor("--font-display-latin")).toBe("false");
    // The last web face in --font-sans-stack carries the metric fallback for
    // the whole stack: both subsets are the same typeface.
    expect(fallbackFor("--font-sans-ext")).toBe('"Arial"');
  });

  it("preloads only the faces that render on the first screen", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    // Body copy is Geist Sans in both locales and Turkish puts latin-ext
    // glyphs above the fold, so both sans subsets are worth a preload. Mono
    // dresses small labels and Instrument Serif renders nothing above the
    // fold, so those faces are discovered from the stylesheet.
    const preloadFor = (variable: string) => {
      const block = source.slice(source.indexOf(`variable: "${variable}"`));
      return block.match(/preload: (true|false)/)?.[1];
    };
    expect(preloadFor("--font-sans-latin")).toBe("true");
    expect(preloadFor("--font-sans-ext")).toBe("true");
    expect(preloadFor("--font-mono-latin")).toBe("true");
    expect(preloadFor("--font-mono-ext")).toBe("false");
    expect(preloadFor("--font-display-latin")).toBe("false");
    expect(preloadFor("--font-display-ext")).toBe("false");
  });

  it("never reaches for next/font/google", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    expect(source).not.toContain("next/font/google");
  });
});
