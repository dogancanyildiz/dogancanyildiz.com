import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locale } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

/**
 * The one OG card layout, shared by the identity image on [lang] and the two
 * per page images under blog/[slug] and projects/[slug].
 *
 * Keeping it here rather than copying the JSX three times is what stops the
 * three cards from drifting: they differ only in the prompt line and whether
 * the middle band carries a page title.
 *
 * Palette and metrics come from .local/export/og-image-1200x630.png, the
 * owner's design reference. Same values as docs/03-tasarim-ui-ux.md's dark
 * column.
 */

const GROUND = "#0a0c0f";
const TEXT = "#f1f3f4";
const MUTED = "#999fa6";
const ACCENT = "#4fcc8d";
/** Watermark: barely off the ground on purpose, it is texture, not content. */
const WATERMARK = "#15181c";

/** Outer gutter of the card. Everything but the watermark aligns to it. */
const PADDING = 72;

/**
 * satori cannot parse woff2 and cannot parse a variable font either: the Geist
 * subsets ship with a wght axis, and satori's glyf reader walks a static
 * outline table, so a variable face throws and the route answers 500 for every
 * page on the site. scripts/vendor-fonts.mjs pins the axis with fontTools and
 * writes the static instances loaded here.
 *
 * Two subsets per family, under two different family names. satori keys its
 * font map by name + weight + style, so two entries sharing all three collapse
 * into one and the loser is never consulted, which silently drops Turkish
 * glyphs (g-breve, dotted capital I) to the built-in fallback face even though
 * the file has them. Distinct names plus both names in the fontFamily chain
 * makes satori try each file per character instead.
 *
 * Weights are exact, never synthesised: sans 400 is the weight a node inherits
 * when it names none, sans 700 draws the name, the page title and the
 * watermark, mono 400 draws the prompt and mono 500 the role line.
 */
const OG_FONT_FILES = [
  { name: "Geist Sans", file: "geist-latin-400.ttf", weight: 400 as const },
  { name: "Geist Sans", file: "geist-latin-700.ttf", weight: 700 as const },
  {
    name: "Geist Sans Ext",
    file: "geist-latin-ext-400.ttf",
    weight: 400 as const,
  },
  {
    name: "Geist Sans Ext",
    file: "geist-latin-ext-700.ttf",
    weight: 700 as const,
  },
  {
    name: "Geist Mono",
    file: "geist-mono-latin-400.ttf",
    weight: 400 as const,
  },
  {
    name: "Geist Mono",
    file: "geist-mono-latin-500.ttf",
    weight: 500 as const,
  },
  {
    name: "Geist Mono Ext",
    file: "geist-mono-latin-ext-400.ttf",
    weight: 400 as const,
  },
  {
    name: "Geist Mono Ext",
    file: "geist-mono-latin-ext-500.ttf",
    weight: 500 as const,
  },
];

const SANS = "Geist Sans, Geist Sans Ext";
const MONO = "Geist Mono, Geist Mono Ext";

/** Reads the static instances the card draws with. */
export async function loadOgFonts() {
  const base = join(process.cwd(), "public", "fonts", "og");
  return Promise.all(
    OG_FONT_FILES.map(async ({ name, file, weight }) => ({
      name,
      data: await readFile(join(base, file)),
      weight,
      style: "normal" as const,
    }))
  );
}

/**
 * Longest title the middle band holds on two lines at 60px.
 *
 * satori clips overflow without a word of warning, and -webkit-line-clamp
 * would drop the tail mid-word with no ellipsis. Cutting on a word boundary
 * here is coarser than measuring the run, but it is deterministic and a test
 * can assert it.
 */
const TITLE_LIMIT = 68;

export function truncateOgTitle(title: string, limit = TITLE_LIMIT): string {
  const trimmed = title.trim();
  if (trimmed.length <= limit) return trimmed;
  const cut = trimmed.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

interface OgCardProps {
  locale: Locale;
  /** The green terminal line at the top, without a trailing cursor. */
  prompt: string;
  /** Middle band. Left empty on the identity card. */
  title?: string;
}

/**
 * The card itself. Returns JSX for ImageResponse, not a React tree that ever
 * hydrates, so every style is inline and satori's flexbox-only subset applies:
 * anything with more than one child declares display flex.
 */
export function OgCard({ locale, prompt, title }: OgCardProps) {
  const { person } = siteConfig;
  const heading = title ? truncateOgTitle(title) : undefined;
  // The name shrinks on a page card so the page's own title stays the loudest
  // thing on it.
  const nameSize = heading ? 44 : 72;
  const roleSize = heading ? 22 : 30;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        background: GROUND,
        fontFamily: SANS,
      }}
    >
      {/* Painted first so the name sits over it, the way the reference has
          it. Anchored left rather than right because the full word has to
          stay inside the frame at this size. */}
      <div
        style={{
          position: "absolute",
          left: PADDING,
          bottom: 8,
          display: "flex",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 130,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: WATERMARK,
        }}
      >
        dogancanyildiz
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: PADDING,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: MONO,
            fontWeight: 400,
            fontSize: 26,
            color: ACCENT,
          }}
        >
          {prompt}
        </div>

        {/* Always rendered, empty on the identity card: it is the flex child
            that holds the middle band open so the name lands at the same
            height on every card. */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            alignItems: "center",
            paddingTop: 28,
            paddingBottom: 28,
          }}
        >
          {heading ? (
            <div
              style={{
                display: "flex",
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 60,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                color: TEXT,
              }}
            >
              {heading}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: nameSize,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: TEXT,
            }}
          >
            {person.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: roleSize,
              lineHeight: 1,
              color: MUTED,
            }}
          >
            {person.jobTitle[locale]}
          </div>
        </div>
      </div>
    </div>
  );
}
