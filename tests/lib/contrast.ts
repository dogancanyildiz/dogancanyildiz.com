/**
 * Minimal WCAG contrast helper for tests. Reads oklch() tokens straight out
 * of globals.css so a token change is caught here instead of only in a
 * browser, and computes contrast the way the browser actually renders it:
 * alpha compositing happens in gamma-encoded sRGB, luminance is computed on
 * the decoded linear values.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** oklch(L C H) -> linear-light sRGB (not yet gamma-encoded). */
export function oklchToLinearSrgb(L: number, C: number, H: number): Rgb {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function encode(channel: number): number {
  const c = Math.min(1, Math.max(0, channel));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function decode(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Blends `fg` at `alpha` over an opaque `bg`, the way `bg-card/50` renders. */
export function compositeOver(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  const blend = (fgC: number, bgC: number) =>
    decode(alpha * encode(fgC) + (1 - alpha) * encode(bgC));
  return {
    r: blend(fg.r, bg.r),
    g: blend(fg.g, bg.g),
    b: blend(fg.b, bg.b),
  };
}

/** WCAG relative luminance, from linear-light sRGB. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two relative luminances, order-independent. */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Reads `--{name}: oklch(L C H);` out of a `:root { ... }` (theme "light")
 * or `.dark { ... }` (theme "dark") block in the given CSS source.
 */
export function readOklchToken(
  css: string,
  name: string,
  theme: "light" | "dark"
): Rgb {
  const blockPattern =
    theme === "light" ? /:root\s*{([^}]*)}/ : /\.dark\s*{([^}]*)}/;
  const block = css.match(blockPattern);
  if (!block)
    throw new Error(
      `No ${theme === "light" ? ":root" : ".dark"} block found in CSS`
    );

  const tokenPattern = new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`);
  const match = block[1].match(tokenPattern);
  if (!match) throw new Error(`Token --${name} not found in ${theme} block`);

  const [L, C, H] = match[1].trim().split(/\s+/).map(Number);
  return oklchToLinearSrgb(L, C, H);
}
