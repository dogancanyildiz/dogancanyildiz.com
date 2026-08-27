import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PROFILE_IMAGE_PATH } from "@/lib/site";

export { PROFILE_IMAGE_PATH };

/**
 * Server side only. Returns false until the owner drops a photo at
 * public/images/profile.jpg (or .webp), so the UI never renders a broken
 * image placeholder.
 */
export function hasProfileImage(): boolean {
  const base = join(process.cwd(), "public", "images", "profile");
  return (
    existsSync(`${base}.jpg`) ||
    existsSync(`${base}.jpeg`) ||
    existsSync(`${base}.webp`)
  );
}

/** Resolved public path when a supported profile image file exists. */
export function profileImagePath(): string | null {
  const base = join(process.cwd(), "public", "images", "profile");
  if (existsSync(`${base}.webp`)) return `${PROFILE_IMAGE_PATH}.webp`;
  if (existsSync(`${base}.jpg`)) return `${PROFILE_IMAGE_PATH}.jpg`;
  if (existsSync(`${base}.jpeg`)) return `${PROFILE_IMAGE_PATH}.jpeg`;
  return null;
}
