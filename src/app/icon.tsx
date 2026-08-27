import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // 03-tasarim-ui-ux.md dark ground and accent.
          background: "#0a0c0f",
          color: "#4fcc8d",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        DCY
      </div>
    ),
    { ...size }
  );
}
