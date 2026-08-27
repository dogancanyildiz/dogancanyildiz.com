import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

// Next calls this once with empty params to enumerate the image ids, then once
// per locale while prerendering, so `lang` has to fall back to the default
// locale instead of being handed to next-intl as undefined.
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return [{ id: "default", size, contentType, alt: t("ogAlt") }];
}

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#09090b",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#27272a",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#a1a1aa",
          }}
        />
      </div>
      <p
        style={{
          fontSize: "20px",
          color: "#71717a",
          margin: "0 0 16px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Portfolio
      </p>
      <h1
        style={{
          fontSize: "64px",
          fontWeight: 700,
          color: "#fafafa",
          margin: "0 0 24px",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        Building clean, fast
        <br />
        experiences for the web
      </h1>
      <p
        style={{
          fontSize: "22px",
          color: "#71717a",
          margin: 0,
          textAlign: "center",
          maxWidth: "700px",
        }}
      >
        React · Next.js · TypeScript
      </p>
    </div>,
    { ...size }
  );
}
