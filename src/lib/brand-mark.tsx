/**
 * Palette: docs/03-tasarim-ui-ux.md dark column + accent.
 *
 * Only the OG card is drawn from here now. The favicon and apple touch icon
 * used to be next/og routes that approximated the mark on satori's built-in
 * face; they are exported brand files under src/app today, so BrandMark and
 * BrandMarkImage went with them.
 */
export const BRAND_MARK = {
  ground: "#0a0c0f",
  surface: "#14171b",
  text: "#f1f3f4",
  muted: "#999fa6",
  accent: "#4fcc8d",
  hairline: "#2a2e33",
} as const;

interface BrandMarkProps {
  size?: number;
}

function brandMarkMetrics(size: number) {
  return {
    radius: Math.max(4, Math.round(size * 0.1875)),
    barWidth: Math.max(2, Math.round(size * 0.09375)),
    fontSize: Math.max(8, Math.round(size * 0.34375)),
    letterSpacing: `${Math.max(0.5, size * 0.035)}px`,
    borderWidth: Math.max(1, Math.round(size * 0.04)),
  };
}

/** Text badge for OG images where Geist Sans is already registered. */
export function BrandMarkText({ size = 72 }: BrandMarkProps) {
  const { radius, barWidth, fontSize, letterSpacing, borderWidth } =
    brandMarkMetrics(size);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_MARK.ground,
        borderRadius: radius,
        border: `${borderWidth}px solid ${BRAND_MARK.hairline}`,
        overflow: "hidden",
        fontFamily: "Geist Sans, Geist Sans Ext",
        fontWeight: 600,
        fontSize,
        letterSpacing,
        lineHeight: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: barWidth,
          background: BRAND_MARK.accent,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: barWidth + Math.round(size * 0.03),
          color: BRAND_MARK.text,
        }}
      >
        <span>D</span>
        <span style={{ color: BRAND_MARK.accent }}>C</span>
        <span>Y</span>
      </div>
    </div>
  );
}
