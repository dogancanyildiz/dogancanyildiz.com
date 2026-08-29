import localFont from "next/font/local";

// Subset ranges copied verbatim from the fontsource packages' unicode.json.
// Inlined as string literals in every declarations array below: Turbopack's
// next/font/local plugin statically extracts the call arguments and drops any
// field whose value is an identifier reference instead of a literal, which
// silently produces a `declarations` entry with no `value` and fails the
// build with "missing field `value`". A shared const worked fine for the
// webpack path (loader.js just destructures the object at runtime) but not
// here, so the two ranges are repeated per call instead of factored out.

// Each subset is its own localFont() call because next/font/local accepts
// unicode-range only per font loader, never per src entry.
//
// adjustFontFallback (next/font/local takes 'Arial', 'Times New Roman' or
// false) generates a size-adjusted local() face and appends it to that loader's
// own font-family list. The generated face carries no unicode-range, so on a
// latin face it would sit in front of the latin-ext face and swallow the
// Turkish glyphs. It is therefore off on every latin face and on only for the
// last web face of a stack, where the adjusted fallback covers the whole stack
// while it loads (both subsets are the same typeface, so the metrics match)
// without shadowing anything: Arial on geistSansExt, Times New Roman on
// instrumentSerifExt, whose stack otherwise drops from a display serif straight
// to the sans faces that follow it in --font-display-stack.
//
// geistMonoExt keeps it off on purpose. Both accepted values are proportional,
// so a size-adjusted Arial would land in --font-mono-stack ahead of
// ui-monospace and render every mono run, the hero metric numerals and code
// blocks alike, in a proportional face until Geist Mono arrives. The mono latin
// subset is preloaded, so that window is short and the metric mismatch it
// leaves behind is the cheaper of the two. CLS was not measured on production
// for any of these three decisions: the live host still answers 526 through
// Cloudflare on HTTPS.
//
// Preloads are deliberately narrow. Every locale renders body copy in Geist
// Sans and Turkish puts latin-ext glyphs on the first screen, so both sans
// subsets are preloaded. Geist Mono only dresses small secondary labels and
// Instrument Serif renders nothing above the fold in either locale, so their
// extra faces are discovered from the stylesheet instead.
export const geistSans = localFont({
  src: "./geist-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const geistSansExt = localFont({
  src: "./geist-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-ext",
  preload: true,
  adjustFontFallback: "Arial",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

export const geistMono = localFont({
  src: "./geist-mono-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-mono-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const geistMonoExt = localFont({
  src: "./geist-mono-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-mono-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

export const instrumentSerif = localFont({
  src: "./instrument-serif-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-latin",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const instrumentSerifExt = localFont({
  src: "./instrument-serif-latin-ext.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-ext",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

export const fontVariables = [
  geistSans.variable,
  geistSansExt.variable,
  geistMono.variable,
  geistMonoExt.variable,
  instrumentSerif.variable,
  instrumentSerifExt.variable,
].join(" ");
