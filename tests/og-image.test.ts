import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

describe("opengraph image", () => {
  const source = read("src/app/[lang]/opengraph-image.tsx");

  it("draws the real identity from site-config, not the template copy", () => {
    expect(source).toContain("siteConfig");
    expect(source).toContain("person.name");
    expect(source).toContain("person.jobTitle[locale]");
    expect(source).not.toContain("Building clean, fast");
    expect(source).not.toContain("Portfolio</p>");
  });

  it("keeps the alt text locale-driven instead of a fixed export", () => {
    expect(source).not.toMatch(/export const alt =/);
    expect(source).toContain('namespace: "metadata"');
    expect(source).toContain('t("ogAlt")');
  });

  it("keeps the per-locale image metadata plumbing", () => {
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("generateImageMetadata");
    expect(source).toContain("hasLocale(routing.locales, lang)");
    expect(source).toContain("routing.defaultLocale");
  });

  it("takes size, contentType and the image id from the shared og-image source", () => {
    expect(source).toContain("OG_IMAGE_SIZE");
    expect(source).toContain("OG_IMAGE_CONTENT_TYPE");
    expect(source).toContain("OG_IMAGE_ID");
    expect(source).toContain("@/lib/seo/og-image");
  });

  it("uses the neutral palette from the design doc", () => {
    expect(source).toContain("#0a0c0f");
    expect(source).toContain("#4fcc8d");
    expect(source).not.toContain("#09090b");
    expect(source).not.toContain("#27272a");
  });

  it("loads both Instrument Serif subsets so Turkish glyphs render", () => {
    expect(source).toContain("instrument-serif-latin.woff");
    expect(source).toContain("instrument-serif-latin-ext.woff");
    expect(source).not.toContain(".woff2");
  });

  it("registers the latin-ext subset under its own family name", () => {
    // satori keys its font table by name + weight + style. Two font entries
    // sharing all three collapse into one (only one subset is ever
    // consulted), which drops Turkish glyphs like g-breve to a fallback face
    // even though the woff file has them. Giving the extended subset a
    // distinct name, and chaining it in the fontFamily fallback list below,
    // is what makes satori actually try both files per character.
    expect(source).toContain('name: "Instrument Serif Ext"');
    const nameOccurrences = source.match(/name:\s*"Instrument Serif"/g) ?? [];
    expect(nameOccurrences).toHaveLength(1);
  });

  it("chains both font family names so per-character fallback can reach the ext subset", () => {
    expect(source).toContain(
      'fontFamily: "Instrument Serif, Instrument Serif Ext"'
    );
  });

  it("stays off the edge runtime", () => {
    expect(source).not.toContain('runtime = "edge"');
  });
});

describe("icon", () => {
  const source = read("src/app/icon.tsx");

  it("renders the DCY monogram on the new palette", () => {
    expect(source).toContain("DCY");
    expect(source).toContain("#0a0c0f");
    expect(source).toContain("#4fcc8d");
    expect(source).not.toContain('background: "black"');
  });
});
