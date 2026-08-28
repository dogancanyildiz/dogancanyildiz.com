import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

/**
 * sfnt table directory tags of a raw ttf/otf buffer. Enough to tell a static
 * instance (no fvar/gvar) from the variable font satori chokes on, without
 * pulling a font parser into the test suite.
 */
function tableTags(buffer: Buffer): string[] {
  const count = buffer.readUInt16BE(4);
  const tags: string[] = [];
  for (let index = 0; index < count; index += 1) {
    tags.push(
      buffer.subarray(12 + index * 16, 16 + index * 16).toString("latin1")
    );
  }
  return tags;
}

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

  it("loads both Geist Sans subsets so Turkish glyphs render", () => {
    expect(source).toContain("geist-latin-400.ttf");
    expect(source).toContain("geist-latin-600.ttf");
    expect(source).toContain("geist-latin-ext-400.ttf");
    expect(source).toContain("geist-latin-ext-600.ttf");
    expect(source).not.toContain(".woff2");
  });

  it("loads static instances, because satori cannot parse a variable font", () => {
    // A face with fvar/gvar makes satori's glyf reader throw, which turns the
    // whole route into a 500 and breaks every og:image on the site.
    expect(source).not.toMatch(/geist-latin(-ext)?\.woff\b/);
    for (const relative of [
      "public/fonts/og/geist-latin-400.ttf",
      "public/fonts/og/geist-latin-600.ttf",
      "public/fonts/og/geist-latin-ext-400.ttf",
      "public/fonts/og/geist-latin-ext-600.ttf",
    ]) {
      const file = join(process.cwd(), relative);
      expect(existsSync(file), `${relative} is missing`).toBe(true);
      const tables = tableTags(readFileSync(file));
      expect(
        tables,
        `${relative} still carries a variation table`
      ).not.toContain("fvar");
      expect(tables).not.toContain("gvar");
      expect(tables).toContain("glyf");
    }
  });

  it("registers the latin-ext subset under its own family name", () => {
    // satori keys its font table by name + weight + style. Two font entries
    // sharing all three collapse into one (only one subset is ever
    // consulted), which drops Turkish glyphs like g-breve to a fallback face
    // even though the file has them. Giving the extended subset a distinct
    // name, and chaining it in the fontFamily fallback list below, is what
    // makes satori actually try both files per character.
    expect(source).toContain('name: "Geist Sans Ext"');
    // One entry per weight for each of the two family names.
    expect(source.match(/name:\s*"Geist Sans"/g) ?? []).toHaveLength(2);
    expect(source.match(/name:\s*"Geist Sans Ext"/g) ?? []).toHaveLength(2);
    expect(source).toContain("weight: 400");
    expect(source).toContain("weight: 600");
  });

  it("chains both font family names so per-character fallback can reach the ext subset", () => {
    expect(source).toContain('fontFamily: "Geist Sans, Geist Sans Ext"');
  });

  it("stays off the edge runtime", () => {
    expect(source).not.toContain('runtime = "edge"');
  });

  it("uses the readable text badge for the DCY mark", () => {
    expect(source).toContain("BrandMarkText");
  });
});

// The source assertions above only prove the file says the right thing. This
// block runs the route: F-004 shipped a route whose every string was correct
// and which still answered 500 for every page on the site, because the font it
// loaded was variable.
describe("opengraph image render", () => {
  it.each(["en", "tr"])(
    "returns a non empty png for %s",
    async (lang) => {
      const route = await import("@/app/[lang]/opengraph-image");
      const response = await route.default({
        params: Promise.resolve({ lang }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");

      const body = Buffer.from(await response.arrayBuffer());
      expect(body.length).toBeGreaterThan(1000);
      // PNG magic number.
      expect([...body.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    },
    30_000
  );

  it("falls back to the default locale for an unrouted lang instead of throwing", async () => {
    const route = await import("@/app/[lang]/opengraph-image");
    const response = await route.default({
      params: Promise.resolve({ lang: "__metadata_id__" }),
    });

    expect(response.status).toBe(200);
  }, 30_000);
});

describe("icon", () => {
  const source = read("src/app/icon.tsx");
  const mark = read("src/lib/brand-mark.tsx");

  it("renders the DCY monogram on the new palette", () => {
    expect(source).toContain("BrandMarkImage");
    expect(mark).toContain("BrandMarkText");
    expect(mark).toContain(">C<");
    expect(mark).toContain("#0a0c0f");
    expect(mark).toContain("#4fcc8d");
    expect(source).not.toContain('background: "black"');
  });

  it("has no stale create-next-app favicon.ico to outrank it in the page head", () => {
    expect(existsSync(join(process.cwd(), "src/app/favicon.ico"))).toBe(false);
  });
});
