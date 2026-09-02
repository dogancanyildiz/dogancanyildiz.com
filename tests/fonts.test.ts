import { existsSync, readdirSync, readFileSync } from "node:fs";
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

// Static instances (fontTools instancer) that the OG route actually loads;
// satori reads neither woff2 nor a variable font.
const VENDORED_OG_TTF = [
  "public/fonts/og/geist-latin-400.ttf",
  "public/fonts/og/geist-latin-600.ttf",
  "public/fonts/og/geist-latin-700.ttf",
  "public/fonts/og/geist-latin-ext-400.ttf",
  "public/fonts/og/geist-latin-ext-600.ttf",
  "public/fonts/og/geist-latin-ext-700.ttf",
  "public/fonts/og/geist-mono-latin-400.ttf",
  "public/fonts/og/geist-mono-latin-500.ttf",
  "public/fonts/og/geist-mono-latin-ext-400.ttf",
  "public/fonts/og/geist-mono-latin-ext-500.ttf",
];

describe("vendored fonts", () => {
  it.each(VENDORED_WOFF2)("%s exists and is a real woff2 file", (relative) => {
    // Read once: a missing file throws here, so no exists/stat probe is
    // needed before the read (and none should precede it, see CodeQL
    // js/file-system-race).
    const bytes = readFileSync(join(root, relative));
    expect(bytes.length).toBeGreaterThan(5000);
    // woff2 magic number: "wOF2"
    expect(bytes.subarray(0, 4).toString("latin1")).toBe("wOF2");
  });

  it.each(VENDORED_OG_TTF)(
    "%s exists and is a static TrueType file",
    (relative) => {
      const bytes = readFileSync(join(root, relative));
      expect(bytes.length).toBeGreaterThan(5000);
      // TrueType sfnt version 1.0
      expect(bytes.subarray(0, 4).toString("hex")).toBe("00010000");
      // No variation tables: satori cannot parse fvar/gvar outlines.
      expect(bytes.includes("fvar")).toBe(false);
      expect(bytes.includes("gvar")).toBe(false);
    }
  );

  it.each(VENDORED_OG_TTF)(
    "%s is pinned to the weight it is named for",
    (relative) => {
      // satori matches a face by exact name + weight + style, so a file whose
      // OS/2 weight class does not match the number in its name means the route
      // registers one weight and draws another.
      const bytes = readFileSync(join(root, relative));
      const named = Number(relative.match(/-(\d{3})\.ttf$/)?.[1]);
      const tableCount = bytes.readUInt16BE(4);
      let os2Offset: number | undefined;
      for (let index = 0; index < tableCount; index += 1) {
        const entry = 12 + index * 16;
        if (bytes.subarray(entry, entry + 4).toString("latin1") === "OS/2") {
          os2Offset = bytes.readUInt32BE(entry + 8);
        }
      }
      if (os2Offset === undefined) throw new Error(`${relative} has no OS/2`);
      // usWeightClass sits at byte 4 of the OS/2 table.
      expect(bytes.readUInt16BE(os2Offset + 4)).toBe(named);
    }
  );

  it("ships no leftover woff copies in the OG font directory", () => {
    const dir = join(root, "public", "fonts", "og");
    const leftovers = readdirSync(dir).filter((name) => name.endsWith(".woff"));
    expect(leftovers).toEqual([]);
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

  it("pins the metric fallback to the exact faces that carry one", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    const fallbackFor = (variable: string) => {
      const block = source.slice(source.indexOf(`variable: "${variable}"`));
      return block.match(/adjustFontFallback: (false|"[^"]+")/)?.[1];
    };
    // The generated fallback face has no unicode-range, so on a latin face it
    // would render the Turkish glyphs in the fallback and the latin-ext file
    // would never be reached.
    expect(fallbackFor("--font-sans-latin")).toBe("false");
    expect(fallbackFor("--font-mono-latin")).toBe("false");
    expect(fallbackFor("--font-display-latin")).toBe("false");
    // The last web face of a stack carries the metric fallback for the whole
    // stack: both subsets are the same typeface, and the generated face sits
    // behind both of them.
    expect(fallbackFor("--font-sans-ext")).toBe('"Arial"');
    expect(fallbackFor("--font-display-ext")).toBe('"Times New Roman"');
    // Mono is the exception: both accepted values are proportional, so an
    // adjusted face here would sit in front of ui-monospace and render the
    // hero metric numerals and code blocks in a proportional font while Geist
    // Mono loads.
    expect(fallbackFor("--font-mono-ext")).toBe("false");
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
