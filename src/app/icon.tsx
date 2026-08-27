import { ImageResponse } from "next/og";
import { BrandMarkImage } from "@/lib/brand-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon: readable DCY monogram (SVG; /icon cannot load custom woff fonts). */
export default function Icon() {
  return new ImageResponse(<BrandMarkImage size={32} />, { ...size });
}
