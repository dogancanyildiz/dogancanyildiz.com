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
    expect(readFileSync(join(process.cwd(), "src/lib/motion.ts"), "utf8")).toContain(
      'MOTION_ITEM_CLASS = "motion-item"'
    );
  });
});
