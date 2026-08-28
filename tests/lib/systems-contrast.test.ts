import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compositeOver,
  contrastRatio,
  readOklchToken,
  relativeLuminance,
} from "./contrast";

// Systems field labels sit on `.surface-panel` (bg-card/50 over the page
// background) and must clear WCAG 1.4.3 (4.5:1, normal text) in both themes.
// This reads the live tokens from globals.css so a token edit that regresses
// contrast fails here instead of only being caught by eye.
const CSS_PATH = join(process.cwd(), "src/app/globals.css");
const SYSTEMS_PATH = join(process.cwd(), "src/components/sections/systems.tsx");
const PANEL_ALPHA = 0.5;
const MIN_CONTRAST = 4.5;

describe("systems panel label contrast", () => {
  const css = readFileSync(CSS_PATH, "utf-8");

  it.each(["light", "dark"] as const)(
    "text-muted-foreground on .surface-panel clears 4.5:1 in %s mode",
    (theme) => {
      const background = readOklchToken(css, "background", theme);
      const card = readOklchToken(css, "card", theme);
      const mutedForeground = readOklchToken(css, "muted-foreground", theme);

      const panel = compositeOver(card, PANEL_ALPHA, background);
      const ratio = contrastRatio(
        relativeLuminance(panel),
        relativeLuminance(mutedForeground)
      );

      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  );

  // The contrast math above only re-derives the number from the token
  // values; it never looks at the component. This regression-locks the
  // other half: the field labels must stay at full opacity, since any
  // `text-muted-foreground/NN` opacity modifier reintroduces the
  // sub-4.5:1 contrast this suite exists to prevent, and the math above
  // would keep passing (it does not read the component either way).
  it("systems.tsx field labels use full-opacity text-muted-foreground, no opacity modifier", () => {
    const source = readFileSync(SYSTEMS_PATH, "utf-8");
    const opacityModifier = /text-muted-foreground\/\d/;

    expect(source).toMatch(/text-muted-foreground(?!\/)/);
    expect(source).not.toMatch(opacityModifier);
  });
});
