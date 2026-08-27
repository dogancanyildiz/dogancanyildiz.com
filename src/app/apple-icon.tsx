import { ImageResponse } from "next/og";
import { BrandMarkImage } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandMarkImage size={180} />, { ...size });
}
