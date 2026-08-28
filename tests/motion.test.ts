import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_STAGGER_ITEMS,
  STAGGER_SECONDS,
  fadeUp,
  staggerContainer,
  staggerDelay,
  staggerItem,
} from "../src/lib/motion";

describe("stagger budget", () => {
  it("uses a 40ms step", () => {
    expect(STAGGER_SECONDS).toBe(0.04);
    expect(MAX_STAGGER_ITEMS).toBe(4);
  });

  it("increases the delay for the first four items only", () => {
    expect(staggerDelay(0)).toBeCloseTo(0);
    expect(staggerDelay(1)).toBeCloseTo(0.04);
    expect(staggerDelay(3)).toBeCloseTo(0.12);
  });

  it("clamps every later item to the fourth item's delay", () => {
    expect(staggerDelay(4)).toBeCloseTo(0.12);
    expect(staggerDelay(25)).toBeCloseTo(0.12);
  });
});

describe("reduced motion variants", () => {
  it("keeps the translate under 4px and the duration under 220ms", () => {
    const variants = fadeUp(false);
    expect(variants.hidden).toEqual({ opacity: 0, y: 4 });
    const show = (variants.show as (index: number) => Record<string, unknown>)(
      2
    );
    expect(show.opacity).toBe(1);
    expect(show.y).toBe(0);
    const transition = show.transition as { duration: number; delay: number };
    expect(transition.duration).toBeLessThanOrEqual(0.22);
    expect(transition.delay).toBeCloseTo(0.08);
  });

  it("collapses to a no-op when the user asked for reduced motion", () => {
    const variants = fadeUp(true);
    expect(variants.hidden).toEqual({ opacity: 1, y: 0 });
    const show = (variants.show as (index: number) => Record<string, unknown>)(
      3
    );
    const transition = show.transition as { duration: number; delay: number };
    expect(transition.duration).toBe(0);
    expect(transition.delay).toBe(0);
    expect(staggerContainer(true).show).toEqual({
      transition: { staggerChildren: 0 },
    });
    expect(staggerItem(true).hidden).toEqual({ opacity: 1, y: 0 });
  });
});

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Returns the full opening tag of every `<m.*>` element in a source file.
 * Attribute values are skipped as units (braces are counted, quoted and
 * template strings are consumed whole) so that a `>` inside an arrow function
 * or a template literal does not end the tag early.
 */
function collectOpeningTags(body: string): string[] {
  const tags: string[] = [];
  for (const match of body.matchAll(/<m\.[A-Za-z]+\b/g)) {
    const start = match.index;
    let depth = 0;
    let quote: string | null = null;
    for (let i = start + match[0].length; i < body.length; i++) {
      const char = body[i];
      if (quote) {
        if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      } else if (char === ">" && depth === 0) {
        tags.push(body.slice(start, i + 1));
        break;
      }
    }
  }
  return tags;
}

const files = collectSourceFiles(join(process.cwd(), "src")).map((file) => ({
  file,
  body: readFileSync(file, "utf8"),
}));

describe("motion imports", () => {
  it("never imports the eager motion component", () => {
    const offenders = files
      .filter(({ body }) =>
        /import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*"motion\/react"/.test(body)
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("has no framer-motion import left", () => {
    expect(
      files
        .filter(({ body }) => body.includes("framer-motion"))
        .map((f) => f.file)
    ).toEqual([]);
  });

  it("has no scroll triggered reveal left", () => {
    expect(
      files
        .filter(({ body }) => body.includes("whileInView"))
        .map((f) => f.file)
    ).toEqual([]);
  });

  it("ships a global prefers-reduced-motion fallback", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".motion-item");
  });

  it("exports a motion item class for the CSS fallback", () => {
    expect(
      readFileSync(join(process.cwd(), "src/lib/motion.ts"), "utf8")
    ).toContain('MOTION_ITEM_CLASS = "motion-item"');
  });
});

describe("hidden variants and the CSS escape hatch", () => {
  // An element that mounts in the hidden variant is written into the
  // prerendered HTML with opacity:0, so it stays invisible until hydration.
  // MOTION_ITEM_CLASS is what the reduced-motion rule in globals.css keys off
  // to force those elements back to visible, so the two must never drift apart.
  const openingTags = files.flatMap(({ file, body }) =>
    collectOpeningTags(body).map((tag) => ({ file, tag }))
  );

  it("reads the whole opening tag even when a prop holds an arrow function", () => {
    // A naive /<m\.[A-Za-z]+\b[^>]*>/ stops at the > of an arrow function, so
    // reordering the props past an onSubmit would hide the initial="hidden"
    // that follows it and the guard below would pass on an unclassed element.
    const source = [
      "<m.form",
      "  onSubmit={(event) => handleSubmit(event)}",
      '  initial="hidden"',
      "  className={`space-y-6 ${MOTION_ITEM_CLASS}`}",
      ">",
    ].join("\n");
    const [tag] = collectOpeningTags(source);
    expect(tag).toContain('initial="hidden"');
    expect(tag).toContain("MOTION_ITEM_CLASS");
  });

  it("gives every element that mounts hidden the motion item class", () => {
    const offenders = openingTags
      .filter(({ tag }) => tag.includes('initial="hidden"'))
      .filter(
        ({ tag }) =>
          !tag.includes("MOTION_ITEM_CLASS") && !tag.includes("motion-item")
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("keeps the LCP sections off the motion path entirely", () => {
    for (const path of [
      "src/components/sections/hero.tsx",
      "src/components/sections/skills-strip.tsx",
      "src/components/sections/project-list.tsx",
      "src/components/sections/post-list.tsx",
    ]) {
      const source = readFileSync(join(process.cwd(), path), "utf8");
      expect(source, path).not.toContain("motion/react");
      expect(source, path).not.toContain('"use client"');
    }
  });
});
