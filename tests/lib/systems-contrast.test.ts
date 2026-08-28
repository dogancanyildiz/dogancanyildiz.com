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
});
