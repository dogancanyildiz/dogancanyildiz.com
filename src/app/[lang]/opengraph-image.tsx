import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { BrandMarkText } from "@/lib/brand-mark";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_ID,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

// Palette: 03-tasarim-ui-ux.md dark column.
const GROUND = "#0a0c0f";
const SURFACE = "#14171b";
const TEXT = "#f1f3f4";
const MUTED = "#999fa6";
const ACCENT = "#4fcc8d";
const HAIRLINE = "#2a2e33";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

// Next calls this once with empty params to enumerate the image ids, then once
// per locale while prerendering, so `lang` has to fall back to the default
// locale instead of being handed to next-intl as undefined. This is the same
// fallback Faz 2 already needed for the same reason, do not drop it.
async function resolveLocale(paramsPromise: Promise<{ lang: string }>) {
  const { lang } = await paramsPromise;
  return hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return [{ id: OG_IMAGE_ID, size, contentType, alt: t("ogAlt") }];
}

// satori cannot parse woff2, so these are the woff copies vendored under
// public/, which the standalone build always ships. Two subsets are passed
// because the latin file has no g-breve or dotted capital I. They are
// registered under two different family names: satori keys its font map by
// name + weight + style, so two entries sharing all three collapse into one
// (the last one registered wins the tie break) and the other subset is never
// consulted, silently dropping Turkish glyphs to the built in fallback face.
// Giving the extended subset its own name and listing both names in the
// fontFamily fallback chain makes satori try each font per character instead.
async function loadSansFonts() {
  const base = join(process.cwd(), "public", "fonts", "og");
  const [latin, latinExt] = await Promise.all([
    readFile(join(base, "geist-latin.woff")),
    readFile(join(base, "geist-latin-ext.woff")),
  ]);
  return [
    {
      name: "Geist Sans",
      data: latin,
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Geist Sans Ext",
      data: latinExt,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  const { person } = siteConfig;
  const fonts = await loadSansFonts();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: GROUND,
        fontFamily: "Geist Sans, Geist Sans Ext",
        padding: "72px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
          }}
        >
          <BrandMarkText size={72} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "9999px",
              background: ACCENT,
            }}
          />
          <div
            style={{
              fontSize: "22px",
              color: MUTED,
              letterSpacing: "0.14em",
              fontFamily: "Geist Sans, Geist Sans Ext",
            }}
          >
            dogancanyildiz.com
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            fontSize: "86px",
            color: TEXT,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: "-0.025em",
          }}
        >
          {person.name}
        </div>
        <div style={{ fontSize: "34px", color: MUTED, lineHeight: 1.3 }}>
          {person.jobTitle[locale]}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: "28px",
          fontSize: "24px",
          color: MUTED,
        }}
      >
        {person.location.city}, Türkiye
      </div>
    </div>,
    { ...size, fonts }
  );
}
