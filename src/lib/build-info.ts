/**
 * Build-time metadata surfaced in the footer. Values are injected through
 * NEXT_PUBLIC_* env vars so they can be read from client components without
 * pulling node:fs into the browser bundle.
 */
export const buildInfo = {
  sha: process.env.NEXT_PUBLIC_BUILD_SHA?.trim() ?? "",
  date: process.env.NEXT_PUBLIC_BUILD_DATE?.trim() ?? "",
} as const;

export function formatBuildSha(sha: string): string {
  return sha.length >= 7 ? sha.slice(0, 7) : sha;
}
