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
  "public/fonts/og/instrument-serif-latin.woff",
  "public/fonts/og/instrument-serif-latin-ext.woff",
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

  it("declares one unicode-range per subset and disables the auto fallback", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    expect(source).toContain("U+0100-02BA");
    expect(source).toContain("U+0131");
    expect(source.match(/adjustFontFallback: false/g)).toHaveLength(6);
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

  it("never reaches for next/font/google", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    expect(source).not.toContain("next/font/google");
  });
});
