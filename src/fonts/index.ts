import localFont from "next/font/local";

// Subset ranges copied verbatim from the fontsource packages' unicode.json.
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

// Each subset is its own localFont() call because next/font/local accepts
// unicode-range only per font loader, never per src entry. adjustFontFallback is
// off everywhere: an auto generated Arial fallback face has no unicode-range and
// would swallow the Turkish glyphs before the latin-ext face is reached.
export const geistSans = localFont({
  src: "./geist-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN }],
});

export const geistSansExt = localFont({
  src: "./geist-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN_EXT }],
});

export const geistMono = localFont({
  src: "./geist-mono-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-mono-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN }],
});

export const geistMonoExt = localFont({
  src: "./geist-mono-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-mono-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN_EXT }],
});

export const instrumentSerif = localFont({
  src: "./instrument-serif-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN }],
});

export const instrumentSerifExt = localFont({
  src: "./instrument-serif-latin-ext.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN_EXT }],
});

export const fontVariables = [
  geistSans.variable,
  geistSansExt.variable,
  geistMono.variable,
  geistMonoExt.variable,
  instrumentSerif.variable,
  instrumentSerifExt.variable,
].join(" ");
