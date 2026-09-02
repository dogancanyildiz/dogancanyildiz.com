/**
 * The DCY logotype, inlined from .local/export/clean/logo-mark-*.svg.
 *
 * One component covers both themes. The exported files differ only in two
 * literal colours, so the letters take currentColor (the header's foreground)
 * and the accent block takes the --primary token, which already resolves to
 * #007041 on the light palette and #4fcc8d on the dark one. Vendoring the two
 * SVG files instead would have meant shipping both and hiding one, which
 * flashes the wrong colour before the theme class lands.
 *
 * The letters are outlines, not text, so no font has to load before the mark
 * is readable and nothing here depends on the Geist subsets.
 *
 * A server component on purpose: it is markup and two colours, and the header
 * is the only client boundary it sits inside.
 */

/** Geometry of the export. Both files share it exactly. */
const VIEW_BOX = "7.4 -72.6 218.8 74.2";
const ASPECT_RATIO = 218.8 / 74.2;

interface BrandMarkProps {
  /** Rendered height in px; the width follows the viewBox ratio. */
  height?: number;
  className?: string;
  /**
   * "blink" animates the green block like a terminal cursor (CSS only, off
   * under prefers-reduced-motion). Default is steady: a mark inside running
   * text or a footer should not pulse.
   */
  cursor?: "steady" | "blink";
}

export function BrandMark({
  height = 22,
  className,
  cursor = "steady",
}: BrandMarkProps) {
  return (
    <svg
      viewBox={VIEW_BOX}
      height={height}
      width={Math.round(height * ASPECT_RATIO * 100) / 100}
      // Decorative: the brand link is labelled by the name next to it, and a
      // title here would make a screen reader announce the mark twice.
      aria-hidden="true"
      focusable="false"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M32.50 0L7.40 0L7.40-71L31.90-71Q49.20-71 58.50-61.75Q67.80-52.50 67.80-35.40L67.80-35.40Q67.80-18.40 58.65-9.20Q49.50 0 32.50 0L32.50 0ZM22.60-58.20L22.60-12.80L31.90-12.80Q42.20-12.80 47.15-18.35Q52.10-23.90 52.10-35.50L52.10-35.50Q52.10-47.10 47.15-52.65Q42.20-58.20 31.90-58.20L31.90-58.20L22.60-58.20ZM105.10 1.60L105.10 1.60Q95.40 1.60 87.85-2.80Q80.30-7.20 76.05-15.50Q71.80-23.80 71.80-35.40L71.80-35.40Q71.80-46.70 75.90-55.05Q80-63.40 87.60-68Q95.20-72.60 105.40-72.60L105.40-72.60Q119.30-72.60 127.05-65.75Q134.80-58.90 137-46.20L137-46.20L121.20-45.60Q120-52.30 116-56.05Q112-59.80 105.40-59.80L105.40-59.80Q99.70-59.80 95.70-56.80Q91.70-53.80 89.60-48.30Q87.50-42.80 87.50-35.40L87.50-35.40Q87.50-27.90 89.65-22.45Q91.80-17 95.80-14.10Q99.80-11.20 105.30-11.20L105.30-11.20Q112.50-11.20 116.45-15.25Q120.40-19.30 121.40-26.50L121.40-26.50L137.30-25.90Q135.90-17.20 131.80-11.10Q127.70-5 121.05-1.70Q114.40 1.60 105.10 1.60ZM173.60 0L158.40 0L158.40-27.60L133.70-71L150.50-71L166-42.40L181.40-71L198.20-71L173.60-27.60L173.60 0Z"
      />
      <rect
        x="209.5"
        y="-9.5"
        width="16.7"
        height="9.5"
        className={
          cursor === "blink" ? "fill-primary brand-cursor" : "fill-primary"
        }
      />
    </svg>
  );
}
