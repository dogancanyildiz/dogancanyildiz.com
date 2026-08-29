import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PROFILE_IMAGE_PATH } from "@/lib/site";

export { PROFILE_IMAGE_PATH };

/** Resolved public path when a supported profile image file exists. */
export function profileImagePath(): string | null {
  const base = join(process.cwd(), "public", "images", "profile");
  if (existsSync(`${base}.webp`)) return `${PROFILE_IMAGE_PATH}.webp`;
  if (existsSync(`${base}.jpg`)) return `${PROFILE_IMAGE_PATH}.jpg`;
  if (existsSync(`${base}.jpeg`)) return `${PROFILE_IMAGE_PATH}.jpeg`;
  return null;
}
